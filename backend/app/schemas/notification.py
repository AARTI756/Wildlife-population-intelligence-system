from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any

class NotificationBase(BaseModel):
    category: str
    severity: str
    priority: str
    title: str
    message: str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    route: Optional[str] = None
    source_module: str
    metadata_json: Optional[Dict[str, Any]] = None

class NotificationCreate(NotificationBase):
    pass

class NotificationResponse(NotificationBase):
    id: int
    is_read: bool
    timestamp: datetime
    created_by_system: bool
    resolved: bool
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class NotificationCountResponse(BaseModel):
    total: int
    unread: int
    critical: int
    warning: int
    info: int
