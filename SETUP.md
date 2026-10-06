# 🛠️ Setup Guide

## Prerequisites

- Node.js 16+ installed
- npm installed
- OpenAI API key (optional, system has fallback)

## Installation

All dependencies are already installed. If you need to reinstall:

```bash
# Backend
cd backend
npm install

# Frontend  
cd ../frontend
npm install
```

## Configuration

**IMPORTANT:** Add your OpenAI API key to `backend/.env`:

```bash
cd backend
echo "OPENAI_API_KEY=sk-your-actual-key-here" >> .env
```

Without it, the system uses a keyword-based fallback classifier (still works for demo).

## Running the Application

### Option 1: Automated (Recommended)

```bash
./start.sh
```

This starts both backend and frontend together.

### Option 2: Manual (Two terminals)

**Terminal 1 - Backend:**
```bash
cd backend
node server.js
```

Wait for: `🚀 Grievance System Backend running on http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
cd frontend
REACT_APP_API_URL=http://localhost:3001 npm start
```

Browser should auto-open to http://localhost:3000

## Verifying Setup

Test the backend:
```bash
cd backend
node test-setup.js
```

Should see:
- ✓ All core packages loaded
- ✓ Database seeded with 10 sample complaints
- ✓ 22 total issues in database

## Demo Workflow

1. **Home Page** - Overview of the system
2. **File Complaint** - Try Aadhaar: `123456789012`, OTP will be shown on screen
3. **Track Status** - Try IDs: `GRV-2025-001`, `GRV-2025-008` (flood emergency)
4. **Department Dashboard** - Select "Water Supply" or "Health" to see issues
5. **Collector Dashboard** - See all issues, high-priority alerts at top
6. **Collector Orders** - Upload image or paste order text

## Sample Test Data

The database is pre-seeded with diverse scenarios:

- `GRV-2025-001` - Water supply outage (High priority)
- `GRV-2025-002` - Roads + Electricity (Multi-department)
- `GRV-2025-003` - Collector order (3 departments)
- `GRV-2025-008` - Flood emergency (4 departments, High priority)
- `GRV-2025-010` - Industrial contamination (3 departments, High priority)

## Troubleshooting

**Backend won't start:**
- Check if port 3001 is already in use: `lsof -i :3001`
- Verify `.env` file exists in backend/

**Frontend won't start:**
- Check if port 3000 is already in use: `lsof -i :3000`
- Ensure REACT_APP_API_URL is set correctly

**AI classification not working:**
- Check OpenAI API key in `backend/.env`
- Check backend console for error messages
- System will fallback to keyword-based classification

**Database issues:**
- Delete `backend/grievance.db` and restart backend to recreate
- Database will auto-seed on first run