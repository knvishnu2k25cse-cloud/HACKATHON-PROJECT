# 🏛️ Citizen Grievance & Government Order Auto-Routing System

**Smart Cities Hackathon Demo**

AI-powered grievance management system that automatically classifies citizen complaints and government orders, splits multi-department issues, detects urgency, and routes to the correct departments — instantly.

## 🚀 Quick Start

### 1. Set up your OpenAI API Key

Edit `backend/.env` and add your OpenAI API key:

```
PORT=3001
OPENAI_API_KEY=sk-your-key-here
```

> **Note:** Without a valid API key, the system will use a fallback keyword-based classifier that still works for the demo.

### 2. Start the application

```bash
./start.sh
```

Or start services manually:

```bash
# Terminal 1: Backend
cd backend
node server.js

# Terminal 2: Frontend
cd frontend
REACT_APP_API_URL=http://localhost:3001 npm start
```

### 3. Open in browser

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001

## 📋 Pages

| Page | URL | Description |
|------|-----|-------------|
| Home | `/` | Landing page with overview |
| File Complaint | `/citizen` | Aadhaar OTP verification → complaint form |
| Collector Orders | `/collector` | Text input or image/PDF upload with OCR |
| Department Dashboard | `/department` | Per-department issue view with resolve action |
| Collector Dashboard | `/collector-dashboard` | Overview of all issues, high-priority alerts |
| Status Tracker | `/status` | Track complaint by ID |

## 🔄 Complete Flow

1. **Citizen** verifies identity via Aadhaar OTP (simulated)
2. **Citizen** submits complaint OR **Collector** enters order (text/scan)
3. **AI** analyzes text → classifies departments → splits multi-issue complaints → detects severity
4. **Issues** auto-routed to correct department dashboards
5. **Department** staff views and resolves issues
6. **Citizen** tracks status via Complaint ID
7. **Collector** monitors everything on the overview dashboard

## 🛠 Tech Stack

- **Frontend:** React 18 + Tailwind CSS + React Router
- **Backend:** Node.js + Express
- **Database:** SQLite (via better-sqlite3)
- **AI:** OpenAI GPT-3.5 (with keyword fallback)
- **OCR:** Tesseract.js

## 📊 Pre-seeded Data

The database comes pre-seeded with 10 sample complaints/orders covering:
- Citizen complaints about water, roads, electricity, sanitation
- Collector orders spanning multiple departments
- High-priority emergencies (floods, building collapse, contamination)

Sample Complaint IDs to try: `GRV-2025-001` through `GRV-2025-010`

## 🎯 Key Features

- ✅ Simulated Aadhaar OTP verification
- ✅ AI-powered multi-department classification
- ✅ Auto-splitting of multi-issue complaints
- ✅ Urgency/severity detection
- ✅ OCR for scanned documents (Tesseract.js)
- ✅ Department-specific dashboards
- ✅ Collector overview with high-priority alerts
- ✅ Real-time status tracking
- ✅ Mark issues as resolved with notes
- ✅ Mobile-responsive UI