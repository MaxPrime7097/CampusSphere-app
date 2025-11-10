# 🚀 CampusSphere Quick Start Guide

## **OPTION 1: SQLite Setup (Easiest - No Database Installation Required)**

### Backend Setup

1. **Navigate to backend folder and create virtual environment:**
   ```powershell
   cd backend
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

2. **Install dependencies:**
   ```powershell
   pip install -r requirements.txt
   ```

3. **Create `.env` file in `backend/` folder:**
   Create `backend\.env` with:
   ```
   DEBUG=True
   SECRET_KEY=your-super-secret-development-key-change-in-production-12345
   ```

4. **Run migrations (creates SQLite database):**
   ```powershell
   python manage.py migrate
   ```

5. **Create superuser (optional, for admin access):**
   ```powershell
   python manage.py createsuperuser
   ```

6. **Start Django server:**
   ```powershell
   python manage.py runserver
   ```
   Backend will run at: **http://127.0.0.1:8000**

### Frontend Setup

7. **In a NEW terminal, install frontend dependencies:**
   ```powershell
   cd ..
   npm install
   ```

8. **Start frontend dev server:**
   ```powershell
   npm run dev
   ```
   Frontend will run at: **http://localhost:8080**

---

## **OPTION 2: Docker Setup (Complete Setup with PostgreSQL & Redis)**

### Prerequisites
- Docker Desktop installed and running

### Steps

1. **Navigate to backend folder:**
   ```powershell
   cd backend
   ```

2. **Start all services with Docker Compose:**
   ```powershell
   docker compose up --build
   ```

3. **In another terminal, run migrations:**
   ```powershell
   cd backend
   docker compose exec web python manage.py migrate
   ```

4. **Create superuser:**
   ```powershell
   docker compose exec web python manage.py createsuperuser
   ```

5. **Frontend (separate terminal):**
   ```powershell
   cd ..
   npm install
   npm run dev
   ```

Access points:
- API: http://localhost:8000
- Frontend: http://localhost:8080

---

## **Which Option Should You Choose?**

- **Option 1 (SQLite)**: Quick testing, simple development, no extra setup
- **Option 2 (Docker)**: Full production-like environment, PostgreSQL + Redis included

**Recommendation**: Start with Option 1 to get running quickly, then move to Option 2 when you need the full stack.

