from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from app.database.connection import Base

class ReportHistory(Base):
    __tablename__ = "report_histories"
    
    id = Column(Integer, primary_key=True, index=True)
    report_name = Column(String(100), nullable=False)
    report_type = Column(String(100), nullable=False, index=True) # Wildlife Survey, Population, Biodiversity, etc.
    generated_by = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    format = Column(String(10), nullable=False) # PDF, XLSX, CSV
    generated_at = Column(DateTime(timezone=True), default=func.now(), index=True)
    filters_json = Column(JSON, nullable=True)
    download_filename = Column(String(255), nullable=False)
    status = Column(String(20), default="Pending", index=True) # Pending, Completed, Failed
    execution_time_ms = Column(Integer, nullable=True)

class ReportAuditLog(Base):
    __tablename__ = "report_audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("report_histories.id", ondelete="SET NULL"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String(50), nullable=False) # generated, downloaded, deleted, regenerated
    report_type = Column(String(100), nullable=True)
    format = Column(String(10), nullable=True)
    timestamp = Column(DateTime(timezone=True), default=func.now())
