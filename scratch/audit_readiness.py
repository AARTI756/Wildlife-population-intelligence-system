import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from fastapi.testclient import TestClient
from app.main import app
from app.auth.dependencies import get_current_user
from app.models.user import User

def main():
    dummy_user = User(id=1, username="audit_admin")
    app.dependency_overrides[get_current_user] = lambda: dummy_user

    client = TestClient(app)
    
    sections = {
        "Module 6: Population Estimation Engine": [
            "/api/population/overview",
            "/api/population/species",
            "/api/population/trends",
            "/api/population/distribution",
            "/api/population/density",
            "/api/population/richness"
        ],
        "Module 7: Biodiversity Analytics Engine": [
            "/api/biodiversity/overview",
            "/api/biodiversity/diversity",
            "/api/biodiversity/abundance",
            "/api/biodiversity/trends",
            "/api/biodiversity/composition",
            "/api/biodiversity/endangered",
            "/api/biodiversity/heatmap"
        ],
        "Module 8: Habitat Intelligence Engine": [
            "/api/habitat/overview",
            "/api/habitat/classification",
            "/api/habitat/vegetation",
            "/api/habitat/environment",
            "/api/habitat/degradation",
            "/api/habitat/suitability",
            "/api/habitat/timeline"
        ],
        "Module 9: Conservation Recommendation Engine": [
            "/api/conservation/overview",
            "/api/conservation/priorities",
            "/api/conservation/restoration",
            "/api/conservation/monitoring",
            "/api/conservation/resources",
            "/api/conservation/actions"
        ],
        "Module 10: Wildlife Health Scoring Engine": [
            "/api/health/overview",
            "/api/health/breakdown",
            "/api/health/trends",
            "/api/health/distribution",
            "/api/health/comparison",
            "/api/health/alerts"
        ],
        "Module 11: Executive Intelligence Command": [
            "/api/intelligence/overview",
            "/api/intelligence/population",
            "/api/intelligence/biodiversity",
            "/api/intelligence/habitat",
            "/api/intelligence/conservation",
            "/api/intelligence/activity",
            "/api/intelligence/alerts",
            "/api/intelligence/map"
        ],
        "Module 12: Notification & Alert System": [
            "/api/notifications",
            "/api/notifications/count",
            "/api/notifications/unread"
        ],
        "Module 13: Reports & Export System": [
            "/api/reports/history",
            "/api/reports/types",
            "/api/reports/stats"
        ]
    }
    
    print("==================================================")
    print("LOG: Initiating Production Readiness Telemetry Audits.")
    print("==================================================")
    
    overall_success = True
    for section_name, endpoints in sections.items():
        print(f"\nEvaluating {section_name}:")
        print("--------------------------------------------------")
        for endpoint in endpoints:
            try:
                res = client.get(endpoint)
                status = res.status_code
                print(f"Endpoint: {endpoint:<30} -> Status {status} ({'PASS' if status == 200 else 'FAIL'})")
                if status != 200:
                    overall_success = False
            except Exception as e:
                print(f"Endpoint: {endpoint:<30} -> EXCEPTION: {e}")
                overall_success = False
        print("--------------------------------------------------")
        
    print("\n==================================================")
    if overall_success:
        print("LOG: All API modules PASSED production readiness checks.")
        sys.exit(0)
    else:
        print("ERROR: Some API modules failed production readiness checks.")
        sys.exit(1)

if __name__ == '__main__':
    main()
