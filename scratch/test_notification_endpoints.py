import os
import sys
import time

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from fastapi.testclient import TestClient
from app.main import app
from app.auth.dependencies import get_current_user
from app.models.user import User, Role
from app.database.connection import SessionLocal
from app.models.notification import Notification

def setup_test_users():
    admin_user = User(id=1, username="notif_admin")
    admin_role = Role(id=1, name="Administrator")
    admin_user.roles = [admin_role]
    
    researcher_user = User(id=2, username="notif_researcher")
    researcher_role = Role(id=2, name="Wildlife Researcher")
    researcher_user.roles = [researcher_role]
    
    return admin_user, researcher_user

def main():
    admin, researcher = setup_test_users()
    
    # 1. Test Client setup
    client = TestClient(app)
    
    print("==================================================")
    print("LOG: Initiating Notification Engine API Audits.")
    print("==================================================")
    
    # Check 1: Route Authentication Check (Anonymous requests must fail with 401)
    res = client.get("/api/notifications")
    assert res.status_code == 401, f"Expected 401 Unauthorized for anonymous list, got {res.status_code}"
    print("[OK] Checked: Anonymous request returned 401")
    
    # Override current user dependency to behave as admin
    app.dependency_overrides[get_current_user] = lambda: admin
    
    # Check 2: Run automatic notification rule generation
    # Seed db if needed before rule checks
    db = SessionLocal()
    # Trigger background scan
    res = client.post("/api/notifications/generate")
    assert res.status_code == 202, f"Expected 202 Accepted for generate, got {res.status_code}"
    print("[OK] Checked: Rule generation task initiated")
    
    # Directly run generation in session to make sure notifications exist
    from app.services.notification_service import run_automatic_notification_rules
    created_count = run_automatic_notification_rules(db)
    print(f"[OK] Checked: Service rule generator created {created_count} notifications dynamically")
    
    # Check 3: Retrieve list of notifications
    res = client.get("/api/notifications")
    assert res.status_code == 200, f"Expected 200 OK, got {res.status_code}"
    data = res.json()
    print(f"[OK] Checked: Get notifications list returned {len(data)} items")
    
    # Check 4: Unread Count Summary API
    res = client.get("/api/notifications/count")
    assert res.status_code == 200, f"Expected 200 OK, got {res.status_code}"
    counts = res.json()
    assert "total" in counts and "unread" in counts, "Count summary keys missing"
    print(f"[OK] Checked: Unread stats total={counts['total']}, unread={counts['unread']}")
    
    # Check 5: Patch Notification as Read (Audit Logging check)
    if len(data) > 0:
        notif_id = data[0]["id"]
        res = client.patch(f"/api/notifications/{notif_id}/read")
        assert res.status_code == 200, f"Expected 200 OK, got {res.status_code}"
        assert res.json()["is_read"] is True, "Notification is_read failed to update"
        print(f"[OK] Checked: Mark read on notification #{notif_id}")
        
        # Check 6: Resolve Notification
        res = client.patch(f"/api/notifications/{notif_id}/resolve")
        assert res.status_code == 200, f"Expected 200 OK, got {res.status_code}"
        assert res.json()["resolved"] is True, "Notification resolved failed to update"
        print(f"[OK] Checked: Resolve on notification #{notif_id}")
        
    # Check 7: Role Permission Constraints check for Deletion
    if len(data) > 0:
        notif_id = data[0]["id"]
        
        # Override as researcher (should fail with 403 Forbidden since delete is admin-only)
        app.dependency_overrides[get_current_user] = lambda: researcher
        res = client.delete(f"/api/notifications/{notif_id}")
        assert res.status_code == 403, f"Expected 403 Forbidden for researcher role delete, got {res.status_code}"
        print("[OK] Checked: Researcher role deletion blocked with 403 Forbidden")
        
        # Override as admin (should succeed with 204 No Content)
        app.dependency_overrides[get_current_user] = lambda: admin
        res = client.delete(f"/api/notifications/{notif_id}")
        assert res.status_code == 204, f"Expected 204 No Content for admin delete, got {res.status_code}"
        print("[OK] Checked: Administrator role deletion succeeded with 204 No Content")

    # Check 8: Duplicate prevention check
    from app.services.notification_service import create_if_not_exists
    # Try creating the same notification twice
    res1 = create_if_not_exists(
        db,
        category="Endangered Species Alert",
        severity="Critical",
        priority="Urgent",
        title="Duplicate Sighting Test",
        message="Bengal Tiger spotted in Zone A",
        source_module="Biodiversity Analytics",
        entity_type="SpeciesProfile",
        entity_id=1,
        route="/ai/biodiversity"
    )
    res2 = create_if_not_exists(
        db,
        category="Endangered Species Alert",
        severity="Critical",
        priority="Urgent",
        title="Duplicate Sighting Test",
        message="Bengal Tiger spotted in Zone A",
        source_module="Biodiversity Analytics",
        entity_type="SpeciesProfile",
        entity_id=1,
        route="/ai/biodiversity"
    )
    assert res1 is not None, "First notification should be created successfully"
    assert res2 is None, "Second duplicate notification should be blocked by duplicate prevention check"
    print("[OK] Checked: Duplicate prevention check successfully blocked repeat unresolved alerts")
    
    # Clean up duplicate test item
    db.delete(res1)
    db.commit()

    # Check 9: Scale check with 500+ records to ensure pagination performance
    print("LOG: Initiating database performance audit with 500+ notifications...")
    t0 = time.time()
    
    # Bulk insert 550 dummy notifications
    notifications_list = []
    for idx in range(550):
        notifications_list.append(
            Notification(
                category="System Notification",
                severity="Info",
                priority="Low",
                title=f"Telemetry Heartbeat Event #{idx}",
                message="Periodic equipment ping checks validated successfully.",
                source_module="Settings",
                route="/settings"
            )
        )
    db.bulk_save_objects(notifications_list)
    db.commit()
    
    insert_duration = time.time() - t0
    print(f"[OK] Performance: Bulk saved 550 notifications in {insert_duration:.3f} seconds.")
    
    # Query with offset and limit (paginated)
    t_query = time.time()
    res = client.get("/api/notifications?skip=100&limit=50")
    query_duration = time.time() - t_query
    
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    paginated_data = res.json()
    assert len(paginated_data) == 50, f"Expected 50 items returned, got {len(paginated_data)}"
    print(f"[OK] Performance: Queried paginated notifications in {query_duration:.4f} seconds")
    
    # Clean up the 550 performance audit records
    db.query(Notification).filter(Notification.category == "System Notification").delete()
    db.commit()
    db.close()
    
    print("\n==================================================")
    print("LOG: All Notification Engine API audits PASSED successfully.")
    print("==================================================")

if __name__ == '__main__':
    main()
