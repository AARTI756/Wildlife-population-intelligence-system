from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.connection import Base

class UploadedImage(Base):
    __tablename__ = "uploaded_images"
    
    id = Column(Integer, primary_key=True, index=True)
    survey_id = Column(Integer, ForeignKey("surveys.id", ondelete="CASCADE"), nullable=True)
    monitoring_site_id = Column(Integer, ForeignKey("monitoring_sites.id", ondelete="CASCADE"), nullable=True)
    filename = Column(String(255), nullable=False)
    filepath = Column(String(500), nullable=False)
    uploader_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default="Pending Analysis")
    ai_summary = Column(Text, nullable=True)
    
    survey = relationship("Survey")
    site = relationship("MonitoringSite")
    uploader = relationship("User")

    @property
    def created_at(self):
        return self.uploaded_at

class UploadedAudio(Base):
    __tablename__ = "uploaded_audios"
    
    id = Column(Integer, primary_key=True, index=True)
    survey_id = Column(Integer, ForeignKey("surveys.id", ondelete="CASCADE"), nullable=True)
    monitoring_site_id = Column(Integer, ForeignKey("monitoring_sites.id", ondelete="CASCADE"), nullable=True)
    filename = Column(String(255), nullable=False)
    filepath = Column(String(500), nullable=False)
    uploader_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default="Pending Analysis")
    ai_summary = Column(Text, nullable=True)
    animal_call_detected = Column(Boolean, default=False, nullable=True)
    animal_call_category = Column(String(100), nullable=True)
    
    survey = relationship("Survey")
    site = relationship("MonitoringSite")
    uploader = relationship("User")

    @property
    def created_at(self):
        return self.uploaded_at
