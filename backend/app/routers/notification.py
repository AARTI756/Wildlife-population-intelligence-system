from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.connection import get_db
from app.models.user import User
from app.auth.dependencies import get_current_user, RoleChecker
from app.schemas.notification import NotificationResponse, NotificationCountResponse
from app.services import notification_service as nsp
from app.models.notification import Notification

router = APIRouter(prefix="/api/notifications", tags=["Notification Center"])

# Allowed role checking definitions
admin_checker = RoleChecker(["Administrator"])

@router.get("", response_model=List[NotificationResponse])
def list_notifications(
    category: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    is_read: Optional[bool] = Query(None),
    resolved: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve role-filtered, user-specific read/unread, and paginated list of notifications."""
    return nsp.list_notifications_for_user(
        db=db,
        user=current_user,
        category=category,
        severity=severity,
        priority=priority,
        is_read_filter=is_read,
        resolved=resolved,
        skip=skip,
        limit=limit
    )

@router.get("/count", response_model=NotificationCountResponse)
def get_counts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch lightweight statistics on total, unread, and severity levels scoped to this user."""
    return nsp.get_unread_count_for_user(db, current_user)

@router.get("/unread", response_model=List[NotificationResponse])
def list_unread_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve list of unread notifications for this user."""
    return nsp.list_notifications_for_user(db=db, user=current_user, is_read_filter=False)

@router.patch("/{id}/read", response_model=NotificationResponse)
def mark_notification_as_read(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a notification as read and record user audit trail log."""
    notif = nsp.mark_read(db, id, current_user.id)
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    # Return enriched dict to match response model correctly
    enriched = nsp.list_notifications_for_user(db=db, user=current_user, skip=0, limit=1000)
    for item in enriched:
        if item["id"] == id:
            return item
    return notif

@router.patch("/read-all")
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark all unread notifications as read and record audit logs."""
    count = nsp.mark_all_read(db, current_user.id, user=current_user)
    return {"message": f"Successfully marked {count} notifications as read"}

@router.patch("/{id}/resolve", response_model=NotificationResponse)
def resolve_notification(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Resolve an ecosystem alert, recording user audit logs."""
    notif = nsp.resolve_notification(db, id, current_user.id)
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    # Return enriched dict to match response model correctly
    enriched = nsp.list_notifications_for_user(db=db, user=current_user, skip=0, limit=1000)
    for item in enriched:
        if item["id"] == id:
            return item
    return notif

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_checker)
):
    """Delete a notification permanently (Restricted to Administrators only)."""
    success = nsp.delete_notification(db, id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return

@router.post("/generate", status_code=status.HTTP_202_ACCEPTED)
def trigger_generation(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Trigger background execution of the notification generation engine rules."""
    background_tasks.add_task(nsp.run_automatic_notification_rules, db)
    return {"message": "Background notification scan initiated"}
