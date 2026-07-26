import requests
import os

BASE_URL = "http://localhost:8000"

def test_pipeline():
    print("LOG: Starting API pipeline tests...")
    
    # 1. Login
    login_data = {
        "username": "admin",
        "password": "Admin@123"
    }
    r_login = requests.post(f"{BASE_URL}/api/auth/login", data=login_data)
    if r_login.status_code != 200:
        print(f"ERROR: Login failed (Status: {r_login.status_code}): {r_login.text}")
        return
        
    token = r_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("LOG: Login successful. Token received.")
    
    # 2. Get Surveys
    r_surveys = requests.get(f"{BASE_URL}/api/surveys", headers=headers)
    if r_surveys.status_code != 200:
        print(f"ERROR: Failed to retrieve active surveys (Status: {r_surveys.status_code}): {r_surveys.text}")
        return
    surveys_data = r_surveys.json()
    if not surveys_data:
        print("LOG: No surveys found. Seeding a test survey...")
        survey_payload = {
            "name": "Validation Test Survey",
            "date": "2026-07-26",
            "monitoring_location": "Ranthambore National Park",
            "latitude": 26.0173,
            "longitude": 76.5026,
            "habitat_type": "Forest",
            "monitoring_device": "Camera Trap",
            "protected_area": True,
            "description": "Integration test survey"
        }
        r_create = requests.post(f"{BASE_URL}/api/surveys", headers=headers, json=survey_payload)
        if r_create.status_code not in [200, 201]:
            print(f"ERROR: Failed to create test survey (Status: {r_create.status_code}): {r_create.text}")
            return
        survey_data = r_create.json()
        survey_id = survey_data["id"]
        site_id = survey_data.get("monitoring_site_id")
    else:
        survey = surveys_data[0]
        survey_id = survey["id"]
        site_id = survey.get("monitoring_site_id")
        
    print(f"LOG: Mapped Active Survey: ID {survey_id}, Site ID {site_id}")

    # 3. Test Image Upload
    image_path = r"c:\Users\spa\OneDrive\Desktop\Wildlife_Population_AI\backend\uploads\images\03a82b7e-d5cc-43da-a3f9-81aff01c8a8b.png"
    if not os.path.exists(image_path):
        print(f"ERROR: Sample image not found at {image_path}")
        return
        
    print("LOG: Triggering image upload pipeline...")
    with open(image_path, "rb") as img_file:
        files = {"file": ("sighting.png", img_file, "image/png")}
        data = {
            "survey_id": str(survey_id),
            "confidence_threshold": "0.10"
        }
        if site_id:
            data["monitoring_site_id"] = str(site_id)
            
        r_img = requests.post(f"{BASE_URL}/api/uploads/image", headers=headers, files=files, data=data)
        
    if r_img.status_code in [200, 201]:
        print("SUCCESS: Image upload and YOLO inference pipeline completed successfully!")
        print(f"Response: {r_img.json()}")
    else:
        print(f"ERROR: Image pipeline failed (Status: {r_img.status_code}): {r_img.text}")
        
    # 4. Test Audio Upload
    audio_path = r"c:\Users\spa\OneDrive\Desktop\Wildlife_Population_AI\backend\tests\test_calls\sample_bird.wav"
    if not os.path.exists(audio_path):
        print(f"ERROR: Sample audio not found at {audio_path}")
        return
        
    print("LOG: Triggering audio upload pipeline...")
    with open(audio_path, "rb") as aud_file:
        files = {"file": ("vocalisation.wav", aud_file, "audio/wav")}
        data = {
            "survey_id": str(survey_id),
            "confidence_threshold": "0.10"
        }
        if site_id:
            data["monitoring_site_id"] = str(site_id)
            
        r_aud = requests.post(f"{BASE_URL}/api/audio/analyze", headers=headers, files=files, data=data)
        
    if r_aud.status_code in [200, 201]:
        print("SUCCESS: Audio upload and BirdNET inference pipeline completed successfully!")
        print(f"Response: {r_aud.json()}")
    else:
        print(f"ERROR: Audio pipeline failed (Status: {r_aud.status_code}): {r_aud.text}")

if __name__ == "__main__":
    test_pipeline()
