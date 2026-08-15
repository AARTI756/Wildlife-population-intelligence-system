import requests

base_url = "http://127.0.0.1:8000"

users = [
    {"username": "admin", "password": "Admin@123", "role": "Administrator"},
    {"username": "researcher", "password": "Admin@123", "role": "Wildlife Researcher"},
    {"username": "asakpal756", "password": "Admin@123", "role": "Conservation Officer"},
    {"username": "john", "password": "Admin@123", "role": "Forest Department Officer"}
]

endpoints = [
    "/api/dashboard/stats",
    "/api/monitoring-sites",
    "/api/surveys",
    "/api/observations",
    "/api/population/species",
    "/api/habitat/classification",
    "/api/biodiversity/endangered",
    "/api/conservation/actions",
    "/api/conservation/priorities"
]

for u in users:
    print(f"\n==================================================")
    print(f"Testing as user: {u['username']} ({u['role']})")
    print(f"==================================================")
    
    # Login
    login_res = requests.post(f"{base_url}/api/auth/login", data={
        "username": u["username"],
        "password": u["password"]
    })
    if login_res.status_code != 200:
        print(f"Login failed: {login_res.status_code} {login_res.text}")
        continue
        
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    for ep in endpoints:
        res = requests.get(f"{base_url}{ep}", headers=headers)
        if res.status_code == 200:
            data = res.json()
            if isinstance(data, list):
                print(f"GET {ep} -> Success (List size: {len(data)})")
            elif isinstance(data, dict):
                # Print select counts if it's dashboard/stats
                if ep == "/api/dashboard/stats":
                    print(f"GET {ep} -> Success (stats keys: total_observations={data.get('total_observations')}, species_count={data.get('species_count')}, total_sites={data.get('total_sites')})")
                else:
                    print(f"GET {ep} -> Success (Dict keys: {list(data.keys())})")
            else:
                print(f"GET {ep} -> Success (Type: {type(data)})")
        else:
            print(f"GET {ep} -> Failed: {res.status_code} {res.text}")
