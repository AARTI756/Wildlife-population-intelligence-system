# Wildlife Population Intelligence System - Milestone 1

A production-ready full-stack web application foundation for a wildlife monitoring platform designed to support role-based surveys, sensor registry, and observation history mapping.

---

## 🛠️ Tech Stack
* **Frontend**: React.js, JavaScript, Tailwind CSS v3, React Router v6, Axios, Lucide React
* **Backend**: Python 3.11, FastAPI, JWT Authentication, SQLAlchemy ORM, Uvicorn
* **Database**: PostgreSQL (Auto-schema creation)

---

## 📂 Project Architecture

```text
Wildlife_Population_AI/
├── backend/
│   ├── app/
│   │   ├── auth/              # Security & dependency gates
│   │   ├── database/          # Engine connection
│   │   ├── models/            # SQLAlchemy database tables
│   │   ├── routers/           # REST endpoints (auth, surveys, etc.)
│   │   ├── schemas/           # Pydantic validation models
│   │   ├── main.py            # Startup, seeding and lifespan
│   │   └── config.py          # Configuration manager
│   ├── requirements.txt       # Python backend dependencies
│   └── .env                   # Environment configurations
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/        # ProtectedRoute alert, etc.
│   │   │   └── layout/        # Layout, Header, Sidebar
│   │   ├── context/           # AuthContext state provider
│   │   ├── hooks/             # Custom useAuth hooks
│   │   ├── pages/             # Frontend page components
│   │   ├── services/          # api.js config & API bindings
│   │   ├── routes/            # Protection routes schema
│   │   ├── App.jsx            # Main route wrapper
│   │   └── index.css          # Design system & Tailwind v3
│   ├── tailwind.config.js     # Tailwind setup
│   ├── postcss.config.js      # PostCSS setup
│   └── package.json           # Node packages
└── docs/                      # Diagrams and API manuals
```

---

## 🔐 Default Demo Accounts

Default credentials seeded automatically at backend startup for quick grading/testing:

| Username | Password | Role | Access Level |
| :--- | :--- | :--- | :--- |
| **admin** | `Admin@123` | `Administrator` | Full read/write + User management |
| **researcher** | `Admin@123` | `Wildlife Researcher` | Survey, Site, Device & Observation write |

---

## 🚀 Installation & Running

### Prerequisites
* PostgreSQL service running locally on port `5432`
* Node.js (v18+) and Python (v3.11+)

### 1. Database Setup
Ensure that a PostgreSQL user exists on your host matching the backend environment details:
* **Host**: `localhost:5432`
* **Username**: `postgres`
* **Password**: `Aarti`
*(The backend will automatically create the database `wildlife_db` and all required tables at startup! No manual PGAdmin schema setup required)*

### 2. Backend Launch
1. Open a terminal in the `backend/` directory.
2. Initialize virtual environment and install packages (if not already done):
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Run the API server:
   ```bash
   .\venv\Scripts\uvicorn app.main:app --reload --port 8000
   ```
4. Verify by visiting: [http://localhost:8000/docs](http://localhost:8000/docs) (Swagger API docs).

### 3. Frontend Launch
1. Open a terminal in the `frontend/` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the React development server:
   ```bash
   npm run dev
   ```
4. Access the web app in your browser at the URL shown in terminal (typically [http://localhost:5173](http://localhost:5173)).
