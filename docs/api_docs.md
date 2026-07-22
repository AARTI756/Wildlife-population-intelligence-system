# Wildlife Population Intelligence System - API Documentation (Milestone 1)

All endpoints require JWT authorization bearer tokens in the header, except for `/api/auth/register` and `/api/auth/login`.

## Authentication & User Profile APIs

### 1. Register User
* **URL**: `/api/auth/register`
* **Method**: `POST`
* **Access**: Public
* **Request Body**:
```json
{
  "username": "field_researcher",
  "email": "researcher@forest.org",
  "password": "securepassword123",
  "roles": ["Wildlife Researcher"]
}
```
* **Response (201 Created)**:
```json
{
  "username": "field_researcher",
  "email": "researcher@forest.org",
  "id": 3,
  "created_at": "2026-06-29T15:24:00.000000",
  "roles": [
    {
      "name": "Wildlife Researcher",
      "description": "Wildlife Researcher Role",
      "id": 2
    }
  ]
}
```

### 2. Login User
* **URL**: `/api/auth/login`
* **Method**: `POST`
* **Access**: Public
* **Request Header**: `Content-Type: application/x-www-form-urlencoded`
* **Request Body (Form Data)**:
  * `username`: field_researcher
  * `password`: securepassword123
* **Response (200 OK)**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "username": "field_researcher",
    "email": "researcher@forest.org",
    "id": 3,
    "created_at": "2026-06-29T15:24:00",
    "roles": [{"name": "Wildlife Researcher", "id": 2}]
  }
}
```

### 3. Get Current Profile
* **URL**: `/api/auth/me`
* **Method**: `GET`
* **Access**: Authenticated users
* **Response (200 OK)**: (Returns current user schema)

---

## User Management APIs (Administrator Only)

* `/api/users` (`GET`): List all accounts.
* `/api/users/roles` (`GET`): List all active RBAC roles.
* `/api/users/{user_id}` (`PUT`): Update user details or grant security roles.
* `/api/users/{user_id}` (`DELETE`): Permanently delete account.

---

## Wildlife Survey APIs

* `/api/surveys` (`GET`): List all surveys.
* `/api/surveys/{survey_id}` (`GET`): View survey details.
* `/api/surveys` (`POST`): Create survey. Allowed roles: `Administrator`, `Wildlife Researcher`, `Forest Department Officer`.
* `/api/surveys/{survey_id}` (`PUT`): Edit survey. Same role restrictions.
* `/api/surveys/{survey_id}` (`DELETE`): Delete survey. Same role restrictions.

---

## Monitoring Site APIs

* `/api/monitoring-sites` (`GET`): List all sites.
* `/api/monitoring-sites` (`POST`): Create site. Allowed roles: `Administrator`, `Wildlife Researcher`, `Conservation Officer`.
* `/api/monitoring-sites/{site_id}` (`PUT`/`DELETE`): Edit/Delete site. Same role restrictions.

---

## Camera Trap APIs

* `/api/camera-traps` (`GET`): List all registered camera traps.
* `/api/camera-traps` (`POST`): Register camera trap. Allowed roles: `Administrator`, `Wildlife Researcher`, `Forest Department Officer`.
* `/api/camera-traps/{trap_id}` (`PUT`/`DELETE`): Edit/Delete camera trap. Same role restrictions.

---

## Audio Sensor APIs

* `/api/audio-sensors` (`GET`): List all audio sensors.
* `/api/audio-sensors` (`POST`): Register audio sensor. Allowed roles: `Administrator`, `Wildlife Researcher`, `Forest Department Officer`.
* `/api/audio-sensors/{sensor_id}` (`PUT`/`DELETE`): Edit/Delete audio sensor. Same role restrictions.

---

## Wildlife Observations APIs

* `/api/observations` (`GET`): List all sightings log history.
* `/api/observations` (`POST`): Log new sighting. Allowed roles: `Administrator`, `Wildlife Researcher`, `Conservation Officer`, `Forest Department Officer`.
* `/api/observations/{obs_id}` (`PUT`/`DELETE`): Edit/Delete sighting records. Same role restrictions.

---

## Dashboard Stats API

### Get System Summary
* **URL**: `/api/dashboard/stats`
* **Method**: `GET`
* **Access**: Authenticated users
* **Response (200 OK)**:
```json
{
  "total_surveys": 2,
  "total_sites": 1,
  "total_camera_traps": 1,
  "total_audio_sensors": 1,
  "recent_observations": [
    {
      "id": 1,
      "survey_id": 1,
      "survey_name": "Serengeti Big Cats Survey",
      "species_name": "Panthera leo (Lion)",
      "count": 3,
      "timestamp": "2026-06-29T15:20:00",
      "observation_type": "Camera Trap",
      "device_id": "CAM-TRAP-01",
      "notes": "Healthy lion pride spotted drinking at pool.",
      "created_by": 2
    }
  ]
}
```
