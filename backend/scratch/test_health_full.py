import requests, json

res = requests.post("http://localhost:8000/api/auth/login", data={"username":"admin","password":"Admin@123"})
token = res.json()["access_token"]
H = {"Authorization": f"Bearer {token}"}

endpoints = [
    "/api/health/overview",
    "/api/health/breakdown",
    "/api/health/trends",
    "/api/health/distribution",
    "/api/health/comparison",
    "/api/health/alerts",
]

for ep in endpoints:
    r = requests.get(f"http://localhost:8000{ep}", headers=H)
    data = r.json()
    print(f"\n{'='*60}")
    print(f"  {ep}  [{r.status_code}]")
    print(json.dumps(data, indent=2)[:800])
