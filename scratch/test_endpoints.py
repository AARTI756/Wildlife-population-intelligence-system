import os
import sys

# Add backend app directory to sys.path to allow imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from fastapi.testclient import TestClient
from app.main import app
from app.auth.dependencies import get_current_user
from app.models.user import User

def main():
    # Mock authentication to allow database read testing without JWT headers
    dummy_user = User(id=1, username="test_researcher")
    app.dependency_overrides[get_current_user] = lambda: dummy_user

    client = TestClient(app)
    
    endpoints = [
        "/api/population/overview",
        "/api/population/species",
        "/api/population/trends",
        "/api/population/distribution",
        "/api/population/density",
        "/api/population/richness"
    ]
    
    print("--------------------------------------------------")
    print("LOG: Initiating Population Estimation API Audits...")
    print("--------------------------------------------------")
    
    all_ok = True
    for endpoint in endpoints:
        try:
            res = client.get(endpoint)
            print(f"Endpoint: {endpoint}")
            print(f"Status  : {res.status_code}")
            if res.status_code == 200:
                data = res.json()
                if isinstance(data, dict):
                    print(f"Summary : Keys: {list(data.keys())}")
                elif isinstance(data, list):
                    print(f"Summary : List size: {len(data)} items")
            else:
                print(f"FAIL    : Response content: {res.text}")
                all_ok = False
            print("--------------------------------------------------")
        except Exception as e:
            print(f"EXCEPTION on {endpoint}: {e}")
            all_ok = False
            print("--------------------------------------------------")
            
    if all_ok:
        print("LOG: All API validation audits PASSED successfully.")
    else:
        print("ERROR: Some API validation audits failed.")
        sys.exit(1)

if __name__ == '__main__':
    main()
