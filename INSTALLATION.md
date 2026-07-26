# Installation Guide - Local Setup

Follow these instructions to configure and execute the Wildlife Population Intelligence System (WPIS) locally.

---

## 📋 Prerequisites

Ensure you have the following installed:
- **Python** (version 3.10 or higher)
- **Node.js** (version 18 or higher)
- **PostgreSQL** (with user `postgres`, password `Aarti`, and database `wildlife_db`)
- **Git** (for version control)

---

## 🛠️ Step-by-Step Installation

### 1. Database Configuration
Make sure PostgreSQL is running on `localhost:5432`.
Create the target database:
```sql
CREATE DATABASE wildlife_db;
```

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run migrations and seed data:
   The backend auto-seeds the tables on first execution. Alternatively, seed the database manually:
   ```bash
   python app/utils/demo_generator.py
   ```
5. Launch the FastAPI Uvicorn dev server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Launch the Vite development server:
   ```bash
   npm run dev
   ```
4. Open the application in your browser:
   ```
   http://localhost:5173
   ```
