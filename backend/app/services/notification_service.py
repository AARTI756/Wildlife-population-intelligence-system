from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from app.models.notification import Notification, NotificationAuditLog
from app.models.monitoring import CameraTrap, AudioSensor
from app.models.species import SpeciesProfile
from app.models.observation import Observation

# Import AI Engine overview calculations directly
from app.services.population_estimation import calculate_population_growth
from app.services.habitat_intelligence import get_habitat_overview
from app.services.health_scoring import get_health_overview

# ---------------------------------------------------------------------------
# Role constants — must match seeded role names exactly
# ---------------------------------------------------------------------------
ROLE_ADMIN = "Administrator"
ROLE_RESEARCHER = "Wildlife Researcher"
ROLE_CONSERVATION = "Conservation Officer"
ROLE_FOREST = "Forest Department Officer"

# Category → which roles should receive that category.
# None / missing = visible to ALL authenticated users.
CATEGORY_ROLE_MAP: Dict[str, Optional[List[str]]] = {
    "Population Decline Alert":   [ROLE_RESEARCHER, ROLE_CONSERVATION, ROLE_ADMIN],
    "Habitat Degradation Alert":  [ROLE_CONSERVATION, ROLE_FOREST, ROLE_ADMIN],
    "Wildlife Health Alert":      [ROLE_RESEARCHER, ROLE_CONSERVATION, ROLE_ADMIN],
    "Monitoring Device Alert":    [ROLE_FOREST, ROLE_ADMIN],
    "Endangered Species Alert":   [ROLE_RESEARCHER, ROLE_CONSERVATION, ROLE_ADMIN],
    "Conservation Recommendation":[ROLE_CONSERVATION, ROLE_ADMIN],
    "Biodiversity Change Alert":  [ROLE_RESEARCHER, ROLE_CONSERVATION, ROLE_ADMIN],
    "AI Detection Alert":         [ROLE_RESEARCHER, ROLE_ADMIN],
    "System Notification":        None,   # Global — all roles
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _user_role_names(user) -> List[str]:
    """Return the list of role name strings for a user ORM object."""
    return [r.name for r in (user.roles or [])]


def _build_role_aware_query(db: Session, user):
    """Return a SQLAlchemy query for Notification rows visible to this user.

    Visibility rules:
      - target_roles IS NULL  → globally visible (all roles)
      - target_roles contains the user's role name → visible
      - Administrator always sees everything
    """
    user_roles = _user_role_names(user)
    query = db.query(Notification)

    if ROLE_ADMIN in user_roles:
        # Admins see everything — no filter
        return query

    # Non-admin: see notifications where target_roles is NULL (global)
    # OR target_roles contains at least one of the user's roles.
    # SQLAlchemy JSON contains check (PostgreSQL):
    # We use a raw SQL approach for portability.
    role_conditions = [Notification.target_roles.is_(None)]
    for role in user_roles:
        # JSON array contains check — works on PostgreSQL with jsonb-style cast
        role_conditions.append(
            Notification.target_roles.cast(
                __import__('sqlalchemy').dialects.postgresql.JSONB
                if False else __import__('sqlalchemy').Text
            ).contains(role)
        )

    # Portable approach: use Python-level filter via a subquery or use JSON overlap
    # Simplest cross-DB approach: load candidate rows then filter in Python.
    # We'll apply the target_roles filtering at the service level rather than DB level
    # to avoid dialect-specific JSON operators.
    return query


def _is_visible_to_user(notif: Notification, user_roles: List[str]) -> bool:
    """Check if a notification is visible to a user with the given roles."""
    if ROLE_ADMIN in user_roles:
        return True
    if notif.target_roles is None:
        return True
    # target_roles is a list; check intersection
    return bool(set(notif.target_roles) & set(user_roles))


def _is_read_by_user(db: Session, notification_id: int, user_id: int) -> bool:
    """Check if a specific user has read this notification via the audit log."""
    return db.query(NotificationAuditLog).filter(
        NotificationAuditLog.notification_id == notification_id,
        NotificationAuditLog.user_id == user_id,
        NotificationAuditLog.action == "read"
    ).first() is not None


def _enrich_with_user_read(notifs: List[Notification], db: Session, user_id: int) -> List[Dict]:
    """Convert ORM objects to dicts with user-specific is_read populated from audit log."""
    if not notifs:
        return []

    # Bulk-load all read audit entries for this user for these notification IDs
    notif_ids = [n.id for n in notifs]
    read_set = set(
        row.notification_id
        for row in db.query(NotificationAuditLog).filter(
            NotificationAuditLog.notification_id.in_(notif_ids),
            NotificationAuditLog.user_id == user_id,
            NotificationAuditLog.action == "read"
        ).all()
    )

    result = []
    for n in notifs:
        d = {
            "id": n.id,
            "category": n.category,
            "severity": n.severity,
            "priority": n.priority,
            "title": n.title,
            "message": n.message,
            "is_read": n.id in read_set,  # per-user read state
            "timestamp": n.timestamp,
            "entity_type": n.entity_type,
            "entity_id": n.entity_id,
            "route": n.route,
            "source_module": n.source_module,
            "created_by_system": n.created_by_system,
            "resolved": n.resolved,
            "resolved_at": n.resolved_at,
            "metadata_json": n.metadata_json,
            "target_roles": n.target_roles,
        }
        result.append(d)
    return result


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def create_notification(db: Session, **fields) -> Notification:
    """Create a notification in the database."""
    notification = Notification(**fields)
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


def create_if_not_exists(
    db: Session,
    category: str,
    severity: str,
    priority: str,
    title: str,
    message: str,
    source_module: str,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    route: Optional[str] = None,
    metadata_json: Optional[Dict[str, Any]] = None,
    target_roles: Optional[List[str]] = None
) -> Optional[Notification]:
    """Check for duplicate unresolved alerts. Only creates if no unresolved alert matches category/module/entity."""
    existing = db.query(Notification).filter(
        Notification.category == category,
        Notification.source_module == source_module,
        Notification.entity_type == entity_type,
        Notification.entity_id == entity_id,
        Notification.resolved == False
    ).first()

    if existing:
        return None

    # Resolve target_roles from CATEGORY_ROLE_MAP if not explicitly passed
    if target_roles is None:
        target_roles = CATEGORY_ROLE_MAP.get(category)  # None = global

    return create_notification(
        db,
        category=category,
        severity=severity,
        priority=priority,
        title=title,
        message=message,
        source_module=source_module,
        entity_type=entity_type,
        entity_id=entity_id,
        route=route,
        metadata_json=metadata_json,
        target_roles=target_roles
    )


def list_notifications_for_user(
    db: Session,
    user,
    category: Optional[str] = None,
    severity: Optional[str] = None,
    priority: Optional[str] = None,
    is_read_filter: Optional[bool] = None,
    resolved: Optional[bool] = None,
    skip: int = 0,
    limit: int = 20
) -> List[Dict]:
    """Return notifications visible to this user, with per-user is_read state."""
    user_roles = _user_role_names(user)

    query = db.query(Notification)

    # Apply non-role filters at DB level
    if category is not None:
        query = query.filter(Notification.category == category)
    if severity is not None:
        query = query.filter(Notification.severity == severity)
    if priority is not None:
        query = query.filter(Notification.priority == priority)
    if resolved is not None:
        query = query.filter(Notification.resolved == resolved)

    # Sort: unresolved first, newest timestamp
    query = query.order_by(
        Notification.resolved.asc(),
        Notification.timestamp.desc()
    )

    # Load all (up to a reasonable cap) and filter by role in Python
    # to avoid dialect-specific JSON operators
    all_candidate = query.all()

    visible = [n for n in all_candidate if _is_visible_to_user(n, user_roles)]

    # Now apply per-user is_read filter if requested
    if is_read_filter is not None:
        notif_ids = [n.id for n in visible]
        read_set = set(
            row.notification_id
            for row in db.query(NotificationAuditLog).filter(
                NotificationAuditLog.notification_id.in_(notif_ids),
                NotificationAuditLog.user_id == user.id,
                NotificationAuditLog.action == "read"
            ).all()
        ) if notif_ids else set()

        if is_read_filter:
            visible = [n for n in visible if n.id in read_set]
        else:
            visible = [n for n in visible if n.id not in read_set]

    # Pagination
    paginated = visible[skip: skip + limit]

    return _enrich_with_user_read(paginated, db, user.id)


def get_unread_count_for_user(db: Session, user) -> Dict[str, int]:
    """Fetch notification stats scoped to this user's role."""
    user_roles = _user_role_names(user)

    all_notifs = db.query(Notification).all()
    visible = [n for n in all_notifs if _is_visible_to_user(n, user_roles)]

    notif_ids = [n.id for n in visible]
    read_set = set(
        row.notification_id
        for row in db.query(NotificationAuditLog).filter(
            NotificationAuditLog.notification_id.in_(notif_ids),
            NotificationAuditLog.user_id == user.id,
            NotificationAuditLog.action == "read"
        ).all()
    ) if notif_ids else set()

    total = len(visible)
    unread = sum(1 for n in visible if n.id not in read_set)
    critical = sum(1 for n in visible if n.severity == "Critical" and not n.resolved)
    warning = sum(1 for n in visible if n.severity == "Warning" and not n.resolved)
    info = sum(1 for n in visible if n.severity == "Info" and not n.resolved)

    return {
        "total": total,
        "unread": unread,
        "critical": critical,
        "warning": warning,
        "info": info
    }


def get_unread_count(db: Session) -> Dict[str, int]:
    """Legacy/fallback — global counts. Kept for backward compat."""
    total = db.query(Notification).count()
    unread = db.query(Notification).filter(Notification.is_read == False).count()
    critical = db.query(Notification).filter(Notification.severity == "Critical", Notification.resolved == False).count()
    warning = db.query(Notification).filter(Notification.severity == "Warning", Notification.resolved == False).count()
    info = db.query(Notification).filter(Notification.severity == "Info", Notification.resolved == False).count()

    return {
        "total": total,
        "unread": unread,
        "critical": critical,
        "warning": warning,
        "info": info
    }


def mark_read(db: Session, notification_id: int, user_id: int) -> Optional[Notification]:
    """Mark a notification as read for this specific user via audit log."""
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        return None

    # Check if already read by this user
    already_read = db.query(NotificationAuditLog).filter(
        NotificationAuditLog.notification_id == notification_id,
        NotificationAuditLog.user_id == user_id,
        NotificationAuditLog.action == "read"
    ).first()

    if not already_read:
        log = NotificationAuditLog(notification_id=notification_id, user_id=user_id, action="read")
        db.add(log)
        # Also update global flag for backward compat
        notif.is_read = True
        db.commit()
        db.refresh(notif)

    return notif


def mark_all_read(db: Session, user_id: int, user=None) -> int:
    """Mark all notifications visible to this user as read, recording per-user audit logs."""
    from app.models.user import User
    if user is None:
        user = db.query(User).filter(User.id == user_id).first()

    user_roles = _user_role_names(user) if user else []
    all_notifs = db.query(Notification).filter(Notification.is_read == False).all()
    visible = [n for n in all_notifs if _is_visible_to_user(n, user_roles)]

    # Find which ones this user hasn't read yet
    notif_ids = [n.id for n in visible]
    already_read_ids = set(
        row.notification_id
        for row in db.query(NotificationAuditLog).filter(
            NotificationAuditLog.notification_id.in_(notif_ids),
            NotificationAuditLog.user_id == user_id,
            NotificationAuditLog.action == "read"
        ).all()
    ) if notif_ids else set()

    count = 0
    for notif in visible:
        if notif.id not in already_read_ids:
            log = NotificationAuditLog(notification_id=notif.id, user_id=user_id, action="read")
            db.add(log)
            notif.is_read = True
            count += 1

    if count > 0:
        db.commit()

    return count


def resolve_notification(db: Session, notification_id: int, user_id: int) -> Optional[Notification]:
    """Resolve an ecosystem alert, marking the resolution timestamp and audit log."""
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        return None

    if not notif.resolved:
        notif.resolved = True
        notif.resolved_at = datetime.utcnow()
        db.commit()
        db.refresh(notif)

        log = NotificationAuditLog(notification_id=notification_id, user_id=user_id, action="resolved")
        db.add(log)
        db.commit()

    return notif


def delete_notification(db: Session, notification_id: int, user_id: int) -> bool:
    """Delete a notification permanently, adding an audit trail trace entry."""
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        return False

    log = NotificationAuditLog(notification_id=notification_id, user_id=user_id, action="deleted")
    db.add(log)
    db.commit()

    db.delete(notif)
    db.commit()
    return True


def run_automatic_notification_rules(db: Session) -> int:
    """Asynchronous/Background execution scanning outputs from Modules 6–10 for alerts.
    Each generated notification is tagged with target_roles so only relevant users see it.
    """
    created_count = 0

    # 1. Population Decline Alert (Module 6) — Researchers + Conservation + Admin
    try:
        growth_rate = calculate_population_growth(db)
        if growth_rate is not None and growth_rate < -30.0:
            res = create_if_not_exists(
                db=db,
                category="Population Decline Alert",
                severity="Critical",
                priority="Urgent",
                title="Significant Population Decline Detected",
                message=f"System growth calculations identify a month-over-month decline of {growth_rate:.1f}%. Immediate habitat review advised.",
                source_module="Population Estimation",
                route="/ai/population-est",
                metadata_json={"growth_rate_pct": growth_rate}
                # target_roles resolved automatically from CATEGORY_ROLE_MAP
            )
            if res:
                created_count += 1
    except Exception as e:
        print(f"Notification Generation Warn (Population Decline): {e}")

    # 2. Habitat Degradation Alert (Module 8) — Conservation + Forest + Admin
    try:
        hab_data = get_habitat_overview(db)
        q_score = float(hab_data.get("habitat_quality_score", 80.0))
        if q_score < 60:
            severity = "Critical" if q_score < 40 else "Warning"
            priority = "High" if q_score < 40 else "Medium"
            res = create_if_not_exists(
                db=db,
                category="Habitat Degradation Alert",
                severity=severity,
                priority=priority,
                title="Habitat Suitability Index Drop",
                message=f"Aggregate forest quality score has dropped to {q_score:.0f}/100.",
                source_module="Habitat Intelligence",
                route="/ai/habitat",
                metadata_json={"habitat_quality_score": q_score}
            )
            if res:
                created_count += 1
    except Exception as e:
        print(f"Notification Generation Warn (Habitat Degradation): {e}")

    # 3. Wildlife Health Alert (Module 10) — Researchers + Conservation + Admin
    try:
        health_data = get_health_overview(db)
        overall_score = float(health_data.get("overallScore", 80.0))
        if overall_score <= 55:
            res = create_if_not_exists(
                db=db,
                category="Wildlife Health Alert",
                severity="Warning",
                priority="High",
                title="Ecosystem Overall Health Vulnerability",
                message=f"Weighted health calculations index falls into Vulnerable/Critical range ({overall_score:.0f}/100).",
                source_module="Wildlife Health Scoring",
                route="/ai/health-scoring",
                metadata_json={"overall_score": overall_score}
            )
            if res:
                created_count += 1
    except Exception as e:
        print(f"Notification Generation Warn (Wildlife Health): {e}")

    # 4. Monitoring Device Alert — Forest + Admin
    try:
        inactive_cameras = db.query(CameraTrap).filter(CameraTrap.status != "Active").all()
        for camera in inactive_cameras:
            res = create_if_not_exists(
                db=db,
                category="Monitoring Device Alert",
                severity="Warning",
                priority="High",
                title=f"Camera Trap Node Offline: {camera.name}",
                message=f"Device ID {camera.camera_id} is reporting status '{camera.status}'.",
                source_module="Camera Trap Management",
                entity_type="CameraTrap",
                entity_id=camera.id,
                route="/camera-traps",
                metadata_json={"device_id": camera.camera_id, "status": camera.status}
            )
            if res:
                created_count += 1

        inactive_audios = db.query(AudioSensor).filter(AudioSensor.status != "Active").all()
        for audio in inactive_audios:
            res = create_if_not_exists(
                db=db,
                category="Monitoring Device Alert",
                severity="Warning",
                priority="High",
                title=f"Audio Sensor Offline: {audio.name}",
                message=f"Device ID {audio.sensor_id} is reporting status '{audio.status}'.",
                source_module="Audio Sensor Management",
                entity_type="AudioSensor",
                entity_id=audio.id,
                route="/audio-sensors",
                metadata_json={"device_id": audio.sensor_id, "status": audio.status}
            )
            if res:
                created_count += 1
    except Exception as e:
        print(f"Notification Generation Warn (Devices): {e}")

    # 5. Endangered Species Alert (Module 5/7) — Researchers + Conservation + Admin
    try:
        endangered_profiles = db.query(SpeciesProfile).filter(
            SpeciesProfile.iucn_status.in_(["Critically Endangered", "Endangered", "Vulnerable"])
        ).all()

        for profile in endangered_profiles:
            recent_obs = db.query(Observation).filter(
                Observation.species_name.ilike(profile.common_name),
                Observation.timestamp >= datetime.utcnow() - timedelta(days=1)
            ).first()

            if recent_obs:
                res = create_if_not_exists(
                    db=db,
                    category="Endangered Species Alert",
                    severity="Info",
                    priority="Medium",
                    title=f"Endangered Sighting: {profile.common_name}",
                    message=f"Standardized re-identification models detected a {profile.common_name} (IUCN: {profile.iucn_status}) in Corbett buffers.",
                    source_module="Biodiversity Analytics",
                    entity_type="SpeciesProfile",
                    entity_id=profile.id,
                    route="/ai/biodiversity",
                    metadata_json={"species_name": profile.common_name, "iucn_status": profile.iucn_status}
                )
                if res:
                    created_count += 1
    except Exception as e:
        print(f"Notification Generation Warn (Endangered Sighting): {e}")

    return created_count
