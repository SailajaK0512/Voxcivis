# VoxCivis - Citizen Complaint & Safe-City Management System

VoxCivis is a municipal and safe-city administration application designed for citizen grievance reporting, automated machine learning department classification, dynamic priority scoring, and department-scoped resolution workflows.

---

##  Technology Stack
- **Backend**: Python FastAPI (REST API + WebSockets)
- **Database**: SQLite with SQLAlchemy ORM (modular architecture ready for PostgreSQL)
- **Frontend**: React + Tailwind CSS (Vite)
- **Machine Learning**: Scikit-Learn NLP Pipeline (TF-IDF Vectorizer + Logistic Regression Classifier + Semantic Hazard Lexicon + Cosine Similarity Clustering)
- **Authentication**: Role-Based Access Control (RBAC) with bcrypt password hashing and JWT tokens

---

##  User Roles & Seed Credentials

| Role | Username | Password | Purpose | Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | Municipal administrator | Full city-wide dashboard, KPIs, Pie Chart, Area Trends, Master Database |
| **Worker (Power)** | `worker_power` | `worker123` | Field technician | Strictly scoped to **Electricity & Power** complaints |
| **Worker (Roads)** | `worker_roads` | `worker123` | Field technician | Strictly scoped to **Roads & Pavements** complaints |
| **Worker (Water)** | `worker_water` | `worker123` | Field technician | Strictly scoped to **Water Supply & Pipeline** complaints |
| **Citizen** | `citizen1` | `citizen123` | Registered resident | Grievance filing, status tracking, delay advisories |

---

##  Running the Application

### 1. Backend (FastAPI)
```bash
cd backend
python3 run.py
# Server runs on http://127.0.0.1:8000
# OpenAPI Docs: http://127.0.0.1:8000/docs
```

### 2. Frontend (React + Tailwind CSS)
```bash
cd frontend
npm run dev
# Portal accessible on http://localhost:5173
```

### 3. Run E2E Test Suite
```bash
cd backend
python3 test_e2e.py
```

---

##  Priority Scoring Formula
$$\text{Score} = \text{Base (10)} + \text{Severe (+20)} + \text{Area Importance (+10)} + 5 \times (\text{Reports} - 1) + 5 \times (\text{Days Unresolved})$$

- **Critical**: $\ge 65$ points
- **High**: $45 - 64$ points
- **Medium**: $25 - 44$ points
- **Low**: $10 - 24$ points
*(All weights and thresholds are configurable in `backend/app/config.py`)*
