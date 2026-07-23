from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.notification import Notification, NotificationAuditLog
from app.models.monitoring import CameraTrap, AudioSensor
from app.models.species import SpeciesProfile
from app.models.observation import Observation

# Import AI Engine overview calculations directly
from app.services.population_estimation import calculate_population_growth
from app.services.habitat_intelligence import get_habitat_overview
from app.services.health_scoring import get_health_overview

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
    metadata_json: Optional[Dict[str, Any]] = None
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
        metadata_json=metadata_json
    )

def get_unread_count(db: Session) -> Dict[str, int]:
    """Fetch lightweight statistics on total, unread, and severity-specific notifications."""
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
    """Mark a notification as read and write to the audit trail log."""
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        return None
        
    if not notif.is_read:
        notif.is_read = True
        db.commit()
        db.refresh(notif)
        
        # Log action
        log = NotificationAuditLog(notification_id=notification_id, user_id=user_id, action="read")
        db.add(log)
        db.commit()
        
    return notif

def mark_all_read(db: Session, user_id: int) -> int:
    """Mark all unread notifications as read and log each action."""
    unread_notifs = db.query(Notification).filter(Notification.is_read == False).all()
    count = len(unread_notifs)
    
    for notif in unread_notifs:
        notif.is_read = True
        log = NotificationAuditLog(notification_id=notif.id, user_id=user_id, action="read")
        db.add(log)
        
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
        
        # Log action
        log = NotificationAuditLog(notification_id=notification_id, user_id=user_id, action="resolved")
        db.add(log)
        db.commit()
        
    return notif

def delete_notification(db: Session, notification_id: int, user_id: int) -> bool:
    """Delete a notification permanently, adding an audit trail trace entry."""
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        return False
        
    # Log deletion trace
    log = NotificationAuditLog(notification_id=notification_id, user_id=user_id, action="deleted")
    db.add(log)
    db.commit()
    
    db.delete(notif)
    db.commit()
    return True

def run_automatic_notification_rules(db: Session) -> int:
    """Asynchronous/Background execution scanning outputs from Modules 6–10 for alerts."""
    created_count = 0
    
    # 1. Population Decline Alert (Module 6)
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
            )
            if res:
                created_count += 1
    except Exception as e:
        print(f"Notification Generation Warn (Population Decline): {e}")

    # 2. Habitat Degradation Alert (Module 8)
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

    # 3. Wildlife Health Alert (Module 10)
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

    # 4. Monitoring Device Alert (Surveys/Sensors)
    try:
        # Check Camera Traps
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
                
        # Check Audio Sensors
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

    # 5. Endangered Species Alert (Module 5/7)
    try:
        endangered_profiles = db.query(SpeciesProfile).filter(
            SpeciesProfile.iucn_status.in_(["Critically Endangered", "Endangered", "Vulnerable"])
        ).all()
        
        for profile in endangered_profiles:
            # Check if there is an observation in the last 24 hours
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
