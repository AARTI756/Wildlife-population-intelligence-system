import requests
import json

# Obtain token
res = requests.post("http://localhost:8000/api/auth/login", data={
    "username": "admin",
    "password": "Admin@123"
})
token = res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# Call population analytics
res_pop = requests.get("http://localhost:8000/api/population/analytics", headers=headers)
print("Status Code:", res_pop.status_code)
print("Response Schema:")
print(json.dumps(res_pop.json(), indent=2))
