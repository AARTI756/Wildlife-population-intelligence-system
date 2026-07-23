import os
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy import func
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional

from app.database.connection import get_db
from app.models.user import User
from app.auth.dependencies import get_current_user, RoleChecker
from app.models.report import ReportHistory, ReportAuditLog
from app.schemas.report import ReportResponse, ReportGenerateRequest, ReportHistoryStatsResponse
from app.services import report_service as rsp

router = APIRouter(prefix="/api/reports", tags=["Reports & Export"])

# Allowed role checkers
admin_checker = RoleChecker(["Administrator"])

REPORT_TYPES_LIST = [
    "Wildlife Survey Report",
    "Species Population Report",
    "Biodiversity Report",
    "Habitat Assessment Report",
    "Conservation Report",
    "Wildlife Health Report",
    "Executive Summary Report"
]

@router.get("/types", response_model=List[str])
def list_report_types(current_user: User = Depends(get_current_user)):
    """Retrieve list of categories supported by the reporting engine."""
    return REPORT_TYPES_LIST

@router.get("/history", response_model=List[ReportResponse])
def get_reports_history(
    report_type: Optional[str] = Query(None),
    format: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(15, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve filtered and paginated list of report history records, newest first."""
    query = db.query(ReportHistory)
    
    if report_type is not None:
        query = query.filter(ReportHistory.report_type == report_type)
    if format is not None:
        query = query.filter(ReportHistory.format == format)
    if status is not None:
        query = query.filter(ReportHistory.status == status)
        
    return query.order_by(ReportHistory.generated_at.desc()).offset(skip).limit(limit).all()

@router.get("/stats", response_model=ReportHistoryStatsResponse)
def get_reports_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch KPI summary numbers on report format logs and speed averages."""
    total = db.query(ReportHistory).count()
    
    # Generated Today count
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today = db.query(ReportHistory).filter(ReportHistory.generated_at >= today_start).count()
    
    pdf = db.query(ReportHistory).filter(ReportHistory.format == "PDF").count()
    excel = db.query(ReportHistory).filter(ReportHistory.format == "XLSX").count()
    csv = db.query(ReportHistory).filter(ReportHistory.format == "CSV").count()
    
    # Calculate average time excluding failed/pending runs
    avg_row = db.query(func.avg(ReportHistory.execution_time_ms)).filter(
        ReportHistory.status == "Completed",
        ReportHistory.execution_time_ms.isnot(None)
    ).first()
    
    avg_time = float(avg_row[0]) if avg_row and avg_row[0] is not None else 0.0
    
    return {
        "total": total,
        "today": today,
        "pdf": pdf,
        "excel": excel,
        "csv": csv,
        "avg_time_ms": avg_time
    }

@router.post("/generate", response_model=ReportResponse, status_code=status.HTTP_202_ACCEPTED)
def request_report_generation(
    payload: ReportGenerateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit a report compile query, executing generation asynchronously as a background task."""
    if payload.report_type not in REPORT_TYPES_LIST:
        raise HTTPException(status_code=400, detail="Invalid report type selection")
    if payload.format not in ["PDF", "XLSX", "CSV"]:
        raise HTTPException(status_code=400, detail="Invalid format selection. Must be PDF, XLSX, or CSV.")
        
    # Standardize filename format: Type_Report_YYYY-MM-DD_H-M-S.ext
    timestamp = datetime.utcnow().strftime("%Y-%m-%d_%H-%M-%S")
    sanitized_type = payload.report_type.replace(" ", "_")
    ext = payload.format.lower() if payload.format != "XLSX" else "xlsx"
    filename = f"{sanitized_type}_{timestamp}.{ext}"
    
    report_name = f"{payload.report_type} ({payload.format})"
    
    report = ReportHistory(
        report_name=report_name,
        report_type=payload.report_type,
        generated_by=current_user.id,
        format=payload.format,
        filters_json=payload.filters,
        download_filename=filename,
        status="Pending"
    )
    
    db.add(report)
    db.commit()
    db.refresh(report)
    
    # Trigger generation task in Background
    background_tasks.add_task(rsp.run_report_generation, db, report.id, current_user.id)
    
    return report

@router.get("/{id}", response_model=ReportResponse)
def get_report_status(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve metadata execution details and build status of a report run."""
    report = db.query(ReportHistory).filter(ReportHistory.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report run not found")
    return report

@router.get("/{id}/download")
def download_report(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Securely fetch and download generated report file, preventing path traversal."""
    report = db.query(ReportHistory).filter(ReportHistory.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report history record not found")
        
    if report.status != "Completed":
        raise HTTPException(status_code=400, detail=f"Report build is currently '{report.status}' and not ready for download.")
        
    # Secure file path resolution
    reports_dir = os.path.abspath(os.path.join("uploads", "reports"))
    filename = os.path.basename(report.download_filename)
    filepath = os.path.abspath(os.path.join(reports_dir, filename))
    
    # Path traversal check
    if not filepath.startswith(reports_dir):
        raise HTTPException(status_code=400, detail="Invalid file download path requested.")
        
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Report file does not exist on disk.")
        
    # Write download action to the audit log
    audit = ReportAuditLog(
        report_id=id,
        user_id=current_user.id,
        action="downloaded",
        report_type=report.report_type,
        format=report.format
    )
    db.add(audit)
    db.commit()
    
    # Expose custom filename to download response headers
    return FileResponse(
        path=filepath,
        filename=filename,
        media_type="application/octet-stream"
    )

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_report_history(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_checker)
):
    """Permanently delete report history item and file from disk (Administrator only)."""
    report = db.query(ReportHistory).filter(ReportHistory.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report history record not found")
        
    # Delete from disk if exists
    reports_dir = os.path.abspath(os.path.join("uploads", "reports"))
    filename = os.path.basename(report.download_filename)
    filepath = os.path.abspath(os.path.join(reports_dir, filename))
    if filepath.startswith(reports_dir) and os.path.exists(filepath):
        try:
            os.remove(filepath)
        except Exception as e:
            print(f"Error removing report file from disk: {e}")
            
    # Write deletion action to audit trail
    audit = ReportAuditLog(
        report_id=id,
        user_id=current_user.id,
        action="deleted",
        report_type=report.report_type,
        format=report.format
    )
    db.add(audit)
    db.commit()
    
    db.delete(report)
    db.commit()
    return
