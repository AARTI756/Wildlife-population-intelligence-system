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
    """Retrieve filtered and paginated list of notifications, newest first."""
    query = db.query(Notification)
    
    if category is not None:
        query = query.filter(Notification.category == category)
    if severity is not None:
        query = query.filter(Notification.severity == severity)
    if priority is not None:
        query = query.filter(Notification.priority == priority)
    if is_read is not None:
        query = query.filter(Notification.is_read == is_read)
    if resolved is not None:
        query = query.filter(Notification.resolved == resolved)
        
    # Sort: Urgent/High priority first, then newest timestamp
    query = query.order_by(
        Notification.resolved.asc(), # unresolved first
        Notification.timestamp.desc()
    )
    
    return query.offset(skip).limit(limit).all()

@router.get("/count", response_model=NotificationCountResponse)
def get_counts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch lightweight statistics on total, unread, and severity levels."""
    return nsp.get_unread_count(db)

@router.get("/unread", response_model=List[NotificationResponse])
def list_unread_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve list of unread notifications."""
    return db.query(Notification).filter(Notification.is_read == False).order_by(Notification.timestamp.desc()).all()

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
    return notif

@router.patch("/read-all")
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark all unread notifications as read and record audit logs."""
    count = nsp.mark_all_read(db, current_user.id)
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
