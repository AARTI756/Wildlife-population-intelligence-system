import requests
import json

# Obtain token
res = requests.post("http://localhost:8000/api/auth/login", data={
    "username": "admin",
    "password": "Admin@123"
})
token = res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# Call habitat intelligence
res_hab = requests.get("http://localhost:8000/api/habitat/intelligence", headers=headers)
print("Status Code:", res_hab.status_code)
print("Response Schema:")
print(json.dumps(res_hab.json(), indent=2))
