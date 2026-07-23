from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from app.database.connection import Base

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(100), nullable=False, index=True)
    severity = Column(String(20), nullable=False, index=True)
    priority = Column(String(20), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    message = Column(String(500), nullable=False)
    is_read = Column(Boolean, default=False, index=True)
    timestamp = Column(DateTime(timezone=True), default=func.now(), index=True)
    entity_type = Column(String(50), nullable=True)
    entity_id = Column(Integer, nullable=True)
    route = Column(String(100), nullable=True)
    source_module = Column(String(50), nullable=False, index=True)
    created_by_system = Column(Boolean, default=True)
    resolved = Column(Boolean, default=False, index=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    metadata_json = Column(JSON, nullable=True)

class NotificationAuditLog(Base):
    __tablename__ = "notification_audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    notification_id = Column(Integer, ForeignKey("notifications.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    action = Column(String(50), nullable=False)  # e.g., "read", "resolved", "deleted"
    timestamp = Column(DateTime(timezone=True), default=func.now())
