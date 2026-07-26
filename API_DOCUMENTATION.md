# API Documentation & Schema References

The WPIS REST API is built using FastAPI and enforces JWT token verification on all protected endpoints.

---

## 🔒 Authentication API

### Post Login credentials
- **Endpoint**: `POST /api/auth/login`
- **Request Body**:
  ```json
  {
    "username": "researcher",
    "password": "Password123"
  }
  ```
- **Response**: Returns standard JWT access token and user metadata.

### Post Google Login token
- **Endpoint**: `POST /api/auth/google-login`
- **Request Body**:
  ```json
  {
    "token": "google_oauth_id_token",
    "role": "Wildlife Researcher"
  }
  ```

---

## 🗺️ GIS & Telemetry APIs

### Get Monitoring Sites
- **Endpoint**: `GET /api/monitoring-sites`
- **Response**: List of active reserves with coordinates and protected area indicators.

### Get Population Density Map
- **Endpoint**: `GET /api/population/density`
- **Response**: Coordinate list of estimated animal counts and density indexes per hectare.

---

## 📊 Analytics & Reporting APIs

### Get Biodiversity Index
- **Endpoint**: `GET /api/biodiversity/diversity`
- **Response**: Shannon diversity index, Simpson index, and abundance trends.

### Post Export Request
- **Endpoint**: `POST /api/reports/export`
- **Request Body**:
  ```json
  {
    "format": "PDF",
    "filters": {
      "site_id": 1,
      "species": "Bengal Tiger"
    }
  }
  ```
- **Response**: Immediate report ID and status (`Pending`, `Completed`).
