from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any

class ReportGenerateRequest(BaseModel):
    report_type: str
    format: str # PDF, XLSX, CSV
    filters: Optional[Dict[str, Any]] = None

class ReportResponse(BaseModel):
    id: int
    report_name: str
    report_type: str
    generated_by: int
    format: str
    generated_at: datetime
    filters_json: Optional[Dict[str, Any]] = None
    download_filename: str
    status: str
    execution_time_ms: Optional[int] = None

    class Config:
        from_attributes = True

class ReportHistoryStatsResponse(BaseModel):
    total: int
    today: int
    pdf: int
    excel: int
    csv: int
    avg_time_ms: float
