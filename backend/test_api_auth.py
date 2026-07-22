import sys
from fastapi.testclient import TestClient
from app.main import app, verify_and_seed_database
from app.database.connection import SessionLocal
from app.models.user import User

def run_tests():
    print("--------------------------------------------------")
    print("LOG: Starting API and Auth verification tests...")
    
    # Run seeding manually for the test
    verify_and_seed_database()
    
    # 1. Verify that the users table contains the seeded users
    db = SessionLocal()
    try:
        users = db.query(User).all()
        user_names = [u.username for u in users]
        print(f"LOG: Registered users in database: {user_names}")
        assert "admin" in user_names, "Error: 'admin' not found in users table!"
        assert "researcher" in user_names, "Error: 'researcher' not found in users table!"
        print("LOG: 1. Seeded users verified in database successfully.")
    except Exception as e:
        print(f"ERROR: Seeded users verification failed: {e}")
        sys.exit(1)
    finally:
        db.close()
        
    # 2. Verify login and JWT authentication via TestClient
    client = TestClient(app)
    
    # Test Login for admin
    print("LOG: Testing login endpoint with 'admin' / 'Admin@123' credentials...")
    login_data = {
        "username": "admin",
        "password": "Admin@123"
    }
    response = client.post("/api/auth/login", data=login_data)
    if response.status_code != 200:
        print(f"ERROR: Login failed. Status code: {response.status_code}, Detail: {response.text}")
        sys.exit(1)
        
    res_data = response.json()
    token = res_data.get("access_token")
    token_type = res_data.get("token_type")
    user_out = res_data.get("user")
    
    print(f"LOG: Login successful! Received token: {token[:20]}...")
    assert token is not None, "Error: Access token not received!"
    assert user_out["username"] == "admin", "Error: Logged in username mismatch!"
    print("LOG: 2. Login endpoint verified successfully.")
    
    # Test Login for researcher
    print("LOG: Testing login endpoint with 'researcher' / 'Admin@123' credentials...")
    login_data = {
        "username": "researcher",
        "password": "Admin@123"
    }
    response = client.post("/api/auth/login", data=login_data)
    if response.status_code != 200:
        print(f"ERROR: Login failed. Status code: {response.status_code}, Detail: {response.text}")
        sys.exit(1)
        
    res_data = response.json()
    token = res_data.get("access_token")
    print(f"LOG: Login successful for researcher! Received token: {token[:20]}...")
    assert token is not None, "Error: Access token not received!"
    
    # 3. Verify JWT authentication on protected profile route
    print("LOG: Testing protected '/api/auth/me' profile endpoint using JWT...")
    headers = {
        "Authorization": f"Bearer {token}"
    }
    profile_response = client.get("/api/auth/me", headers=headers)
    if profile_response.status_code != 200:
        print(f"ERROR: JWT verification failed on '/me'. Status code: {profile_response.status_code}, Detail: {profile_response.text}")
        sys.exit(1)
        
    profile_data = profile_response.json()
    print(f"LOG: Profile retrieval successful! Logged in as: {profile_data['username']} with roles: {[r['name'] for r in profile_data['roles']]}")
    assert profile_data["username"] == "researcher", "Error: Profile username mismatch!"
    print("LOG: 3. JWT Authentication verified successfully.")
    
    print("--------------------------------------------------")
    print("LOG: All API and Authentication tests passed successfully!")
    print("--------------------------------------------------")

if __name__ == "__main__":
    run_tests()
