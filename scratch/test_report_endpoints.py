import os
import sys
import time

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from fastapi.testclient import TestClient
from app.main import app
from app.auth.dependencies import get_current_user
from app.models.user import User, Role
from app.database.connection import SessionLocal, engine, Base
from app.models.report import ReportHistory, ReportAuditLog
from sqlalchemy import text

def setup_test_users():
    admin_user = User(id=1, username="report_admin")
    admin_role = Role(id=1, name="Administrator")
    admin_user.roles = [admin_role]
    
    researcher_user = User(id=2, username="report_researcher")
    researcher_role = Role(id=2, name="Wildlife Researcher")
    researcher_user.roles = [researcher_role]
    
    return admin_user, researcher_user

def main():
    # Recreate tables to ensure SET NULL schema is applied
    db = SessionLocal()
    try:
        db.execute(text("DROP TABLE IF EXISTS report_audit_logs CASCADE"))
        db.execute(text("DROP TABLE IF EXISTS report_histories CASCADE"))
        db.commit()
    except Exception as e:
        print(f"Warn: Tables drop failed: {e}")
    finally:
        db.close()
        
    Base.metadata.create_all(bind=engine)
    
    admin, researcher = setup_test_users()
    
    # 1. Test Client setup
    client = TestClient(app)
    
    print("==================================================")
    print("LOG: Initiating Reports & Export System API Audits.")
    print("==================================================")
    
    # Check 1: Route Authentication Check (Anonymous requests must fail with 401)
    res = client.get("/api/reports/history")
    assert res.status_code == 401, f"Expected 401 Unauthorized for anonymous list, got {res.status_code}"
    print("[OK] Checked: Anonymous request returned 401")
    
    # Override current user dependency to behave as admin
    app.dependency_overrides[get_current_user] = lambda: admin
    
    # Check 2: Retrieve supported report types
    res = client.get("/api/reports/types")
    assert res.status_code == 200, f"Expected 200 OK, got {res.status_code}"
    types = res.json()
    assert "Wildlife Survey Report" in types, "Report types missing Wildlife Survey"
    print(f"[OK] Checked: Retreived {len(types)} supported report types")
    
    # Check 3: Generate CSV Report
    res = client.post("/api/reports/generate", json={
        "report_type": "Wildlife Survey Report",
        "format": "CSV",
        "filters": {}
    })
    assert res.status_code == 202, f"Expected 202 Accepted, got {res.status_code}"
    csv_report = res.json()
    csv_id = csv_report["id"]
    print(f"[OK] Checked: CSV Report generation requested (ID: {csv_id})")
    
    # Poll for completion
    completed = False
    for _ in range(10):
        res = client.get(f"/api/reports/{csv_id}")
        status = res.json()["status"]
        if status == "Completed":
            completed = True
            break
        elif status == "Failed":
            break
        time.sleep(0.5)
    assert completed, "CSV Report generation failed to complete"
    print(f"[OK] Checked: CSV Report status completed in background")
    
    # Check 4: Download CSV file
    res = client.get(f"/api/reports/{csv_id}/download")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    print(f"[OK] Checked: CSV Report downloaded successfully ({len(res.content)} bytes)")
    
    # Check 5: Generate Excel Report
    res = client.post("/api/reports/generate", json={
        "report_type": "Species Population Report",
        "format": "XLSX",
        "filters": {}
    })
    assert res.status_code == 202, f"Expected 202 Accepted, got {res.status_code}"
    xlsx_report = res.json()
    xlsx_id = xlsx_report["id"]
    print(f"[OK] Checked: Excel Report generation requested (ID: {xlsx_id})")
    
    # Poll for completion
    completed = False
    for _ in range(10):
        res = client.get(f"/api/reports/{xlsx_id}")
        status = res.json()["status"]
        if status == "Completed":
            completed = True
            break
        time.sleep(0.5)
    assert completed, "Excel Report generation failed to complete"
    print(f"[OK] Checked: Excel Report status completed in background")
    
    # Check 6: Download Excel file
    res = client.get(f"/api/reports/{xlsx_id}/download")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    print(f"[OK] Checked: Excel Report downloaded successfully ({len(res.content)} bytes)")
    
    # Check 7: Generate PDF Report
    res = client.post("/api/reports/generate", json={
        "report_type": "Biodiversity Report",
        "format": "PDF",
        "filters": {}
    })
    assert res.status_code == 202, f"Expected 202 Accepted, got {res.status_code}"
    pdf_report = res.json()
    pdf_id = pdf_report["id"]
    print(f"[OK] Checked: PDF Report generation requested (ID: {pdf_id})")
    
    # Poll for completion
    completed = False
    for _ in range(10):
        res = client.get(f"/api/reports/{pdf_id}")
        status = res.json()["status"]
        if status == "Completed":
            completed = True
            break
        time.sleep(0.5)
    assert completed, "PDF Report generation failed to complete"
    print(f"[OK] Checked: PDF Report status completed in background")
    
    # Check 8: Download PDF file
    res = client.get(f"/api/reports/{pdf_id}/download")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    print(f"[OK] Checked: PDF Report downloaded successfully ({len(res.content)} bytes)")
    
    # Check 9: Stats overview API
    res = client.get("/api/reports/stats")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    stats = res.json()
    assert stats["total"] >= 3, "Total reports stats incorrect"
    print(f"[OK] Checked: Reports dashboard stats total={stats['total']}, avg_time={stats['avg_time_ms']:.1f}ms")
    
    # Check 10: Role permissions deletion check
    # Override as researcher (should fail with 403)
    app.dependency_overrides[get_current_user] = lambda: researcher
    res = client.delete(f"/api/reports/{pdf_id}")
    assert res.status_code == 403, f"Expected 403 Forbidden for researcher role delete, got {res.status_code}"
    print("[OK] Checked: Researcher role deletion blocked with 403 Forbidden")
    
    # Override as admin (should succeed with 204)
    app.dependency_overrides[get_current_user] = lambda: admin
    res = client.delete(f"/api/reports/{pdf_id}")
    assert res.status_code == 204, f"Expected 204 No Content for admin delete, got {res.status_code}"
    print("[OK] Checked: Administrator role deletion succeeded with 204 No Content")
    
    # Check 11: Audit log trace verification
    db = SessionLocal()
    audit_logs = db.query(ReportAuditLog).all()
    assert len(audit_logs) > 0, "No audit logs recorded"
    actions = [a.action for a in audit_logs]
    assert "generated" in actions, "Generated action trace missing"
    assert "downloaded" in actions, "Downloaded action trace missing"
    assert "deleted" in actions, "Deleted action trace missing"
    print(f"[OK] Checked: Audit logging tracks all generated/downloaded/deleted events")
    
    # Clean up test reports from database
    db.query(ReportHistory).delete()
    db.query(ReportAuditLog).delete()
    db.commit()
    db.close()
    
    print("\n==================================================")
    print("LOG: All Reports & Export System API audits PASSED successfully.")
    print("==================================================")

if __name__ == '__main__':
    main()
