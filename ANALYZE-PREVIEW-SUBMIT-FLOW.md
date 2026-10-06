# 🔍 Analyze & Preview Flow - Complete Documentation

**Date:** September 9, 2026  
**Feature:** Two-step complaint submission with AI preview

---

## ✅ New Flow Implementation

### Before (Old Flow):
```
Citizen fills form → Click "Submit" → AI analyzes → Saves to DB → Success
```

### After (New Flow):
```
Citizen fills form → Click "Analyze & Split" → AI analyzes → PREVIEW → 
    ↓
    ├─ Edit (go back to form)
    └─ Submit Complaints → Saves to DB → Success
```

---

## 🎯 Key Changes

### 1. Two-Step Process

**Step 1: Analyze & Split (Preview Only)**
- Button: "🔍 Analyze & Split Complaint"
- Action: Calls `/api/complaints/analyze`
- Result: Shows AI analysis preview
- **NO DATABASE SAVE** at this stage

**Step 2: Final Submission**
- Button: "✅ Submit Complaints"
- Action: Calls `/api/complaints/submit` with pre-analyzed issues
- Result: Saves all issues to database, generates complaint ID

### 2. Edit Option

**Button: "✏️ Edit Complaint"**
- Returns to the form
- Discards previous AI analysis
- Citizen can modify the complaint
- Must click "Analyze & Split" again

---

## 📁 Files Modified

### Frontend:
1. **`frontend/src/pages/CitizenComplaint.jsx`** - Complete rewrite
   - Added `analyzing` state
   - Added `analyzedIssues` state
   - New `handleAnalyze()` function
   - New `handleEdit()` function
   - Updated `handleFinalSubmit()` function
   - Preview UI for analyzed issues

### Backend:
1. **`backend/server.js`** - Added new endpoint
   - **NEW:** `/api/complaints/analyze` - Analysis only, no DB save
   - **UPDATED:** `/api/complaints/submit` - Accepts pre-analyzed issues

---

## 🔌 API Endpoints

### New Endpoint: Analyze (Preview)

**POST** `/api/complaints/analyze`

**Request:**
```json
{
  "description": "streetlight problem in our street, and water problem in our area",
  "deadline": "within 1 month"
}
```

**Response:**
```json
{
  "success": true,
  "issues": [
    {
      "department": "Electricity",
      "issue_text": "Streetlight problem in the street",
      "deadline": "within 1 month",
      "priority": "Normal"
    },
    {
      "department": "Water Supply",
      "issue_text": "Water problem in the area",
      "deadline": "within 1 month",
      "priority": "Normal"
    }
  ]
}
```

**Key Points:**
- ❌ **Does NOT save to database**
- ❌ **Does NOT generate complaint ID**
- ✅ **Only returns AI analysis**
- ✅ **Uses citizen-provided deadline for all issues**

### Updated Endpoint: Submit

**POST** `/api/complaints/submit`

**Request (with pre-analyzed issues):**
```json
{
  "name": "Test User",
  "location": "Test Area",
  "description": "streetlight problem in our street, and water problem in our area",
  "deadline": "within 1 month",
  "aadhaar": "123456789012",
  "analyzedIssues": [
    {
      "department": "Electricity",
      "issue_text": "Streetlight problem in the street",
      "deadline": "within 1 month",
      "priority": "Normal"
    },
    {
      "department": "Water Supply",
      "issue_text": "Water problem in the area",
      "deadline": "within 1 month",
      "priority": "Normal"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "complaint_id": "GRV-2025-011",
  "source": "citizen",
  "issues": [
    {
      "department": "Electricity",
      "issue_text": "Streetlight problem in the street",
      "deadline": "within 1 month",
      "priority": "Normal",
      "status": "Pending",
      "id": 0
    },
    {
      "department": "Water Supply",
      "issue_text": "Water problem in the area",
      "deadline": "within 1 month",
      "priority": "Normal",
      "status": "Pending",
      "id": 1
    }
  ]
}
```

**Key Points:**
- ✅ **Saves to database**
- ✅ **Generates complaint ID**
- ✅ **Uses pre-analyzed issues if provided**
- ✅ **Fallback: Re-analyzes if analyzedIssues not provided**

---

## 🎨 UI Flow

### 1. Initial Form

```
┌─────────────────────────────────────┐
│ Step 2: Complaint Details           │
├─────────────────────────────────────┤
│ Full Name: [____________]           │
│ Location: [____________]            │
│ Description: [____________]         │
│ Deadline: [____________]            │
│                                     │
│ [🔍 Analyze & Split Complaint]     │
└─────────────────────────────────────┘
```

### 2. Analyzing State

```
┌─────────────────────────────────────┐
│ 🤖 Analyzing your complaint and     │
│    identifying departments...       │
│                                     │
│    [Loading spinner]                │
└─────────────────────────────────────┘
```

### 3. Preview Results

```
┌─────────────────────────────────────┐
│ ✅ Analysis Complete!               │
│ Your complaint has been split into  │
│ 2 problem(s). Review and submit.    │
├─────────────────────────────────────┤
│ Problem 1                           │
│ → Issue: Streetlight problem...    │
│ → Department: 🏢 Electricity        │
│ → Priority: Normal                  │
│ → Deadline: within 1 month          │
├─────────────────────────────────────┤
│ Problem 2                           │
│ → Issue: Water problem...           │
│ → Department: 🏢 Water Supply       │
│ → Priority: Normal                  │
│ → Deadline: within 1 month          │
├─────────────────────────────────────┤
│ [✅ Submit Complaints]  [✏️ Edit]   │
└─────────────────────────────────────┘
```

### 4. After Submit

```
┌─────────────────────────────────────┐
│ ✅ Complaints Submitted!            │
│                                     │
│ Your 2 complaint(s) have been       │
│ routed to departments.              │
│                                     │
│ Complaint ID: GRV-2025-011          │
│                                     │
│ [🔍 View Status]  [📝 File Another] │
└─────────────────────────────────────┘
```

---

## 🧪 Test Cases

### Test Case 1: Multi-Department Split

**Input:**
```
Description: "streetlight problem in our street, and water problem in our area"
Deadline: "within 1 month"
```

**Expected Analysis:**
```
Problem 1:
→ Issue: Streetlight problem in the street
→ Department: Electricity
→ Priority: Normal
→ Deadline: within 1 month

Problem 2:
→ Issue: Water problem in the area
→ Department: Water Supply
→ Priority: Normal (or High if AI detects urgency)
→ Deadline: within 1 month
```

**After Submit:**
- 2 separate complaints in database
- Both visible in Collector Dashboard
- Routed to Electricity and Water Supply departments
- Status: Pending

### Test Case 2: Single Department

**Input:**
```
Description: "Water pipeline broken in sector 5"
Deadline: "Urgent"
```

**Expected Analysis:**
```
Problem 1:
→ Issue: Water pipeline broken in sector 5
→ Department: Water Supply
→ Priority: High (if "urgent" detected)
→ Deadline: Urgent
```

### Test Case 3: Three+ Departments (High Priority)

**Input:**
```
Description: "No water supply, electricity outages, garbage overflowing, and potholes everywhere"
Deadline: "2 weeks"
```

**Expected Analysis:**
```
Problem 1: Water Supply
Problem 2: Electricity
Problem 3: Sanitation
Problem 4: Roads & Infrastructure

All marked as High Priority (3+ departments rule)
All have deadline: "2 weeks"
```

### Test Case 4: Edit Flow

1. Fill form, click "Analyze & Split"
2. See preview with 2 problems
3. Click "✏️ Edit"
4. **Expected:** Returns to form, analysis discarded
5. Modify description
6. Click "Analyze & Split" again
7. **Expected:** New analysis shown

---

## ✅ Flow Verification Checklist

- [ ] OTP verification still works (unchanged)
- [ ] Form validation works (name, location, description, deadline required)
- [ ] "Analyze & Split" button appears
- [ ] Clicking "Analyze & Split" shows loading state
- [ ] Analysis preview appears after loading
- [ ] Preview shows all problems correctly
- [ ] Each problem shows: department, priority, deadline, issue text
- [ ] "✅ Submit Complaints" button appears in preview
- [ ] "✏️ Edit" button appears in preview
- [ ] Clicking "Edit" returns to form
- [ ] Previous analysis is discarded on edit
- [ ] Clicking "Submit Complaints" saves to database
- [ ] Success screen shows complaint ID
- [ ] Multiple complaints appear separately in Collector Dashboard
- [ ] Each complaint routed to correct department
- [ ] All complaints have status "Pending"

---

## 🔍 Database Behavior

### During "Analyze & Split":
```sql
-- NO database operations
-- Only AI analysis happens
```

### During "Submit Complaints":
```sql
-- 1. Create complaint record
INSERT INTO complaints (id, source, citizen_name, citizen_location, original_text, aadhaar_hash)
VALUES ('GRV-2025-011', 'citizen', 'Test User', 'Test Area', '...', '****');

-- 2. Create issue records (one per problem)
INSERT INTO issues (complaint_id, department, issue_text, deadline, priority)
VALUES ('GRV-2025-011', 'Electricity', 'Streetlight problem...', 'within 1 month', 'Normal');

INSERT INTO issues (complaint_id, department, issue_text, deadline, priority)
VALUES ('GRV-2025-011', 'Water Supply', 'Water problem...', 'within 1 month', 'Normal');
```

---

## 🎯 Benefits of This Flow

### For Citizens:
- ✅ **Preview before submit** - See how AI will route the complaint
- ✅ **Edit option** - Fix mistakes before final submission
- ✅ **Transparency** - Know exactly which departments will handle what
- ✅ **Confidence** - Verify AI understood the complaint correctly

### For Development:
- ✅ **Separation of concerns** - Analysis separate from database save
- ✅ **Better error handling** - Can fail at analysis without affecting database
- ✅ **Flexibility** - Can add approval/review steps in future
- ✅ **Testability** - Can test AI without database side effects

---

## 🚀 Testing Instructions

### Quick Test:

1. **Start servers:**
   ```bash
   cd backend && node server.js
   cd frontend && REACT_APP_API_URL=http://localhost:3001 npm start
   ```

2. **Open:** http://localhost:3000/citizen

3. **Complete OTP:**
   - Aadhaar: `123456789012`
   - OTP: Any 6 digits (e.g., `123456`)

4. **Fill form:**
   ```
   Name: Test User
   Location: Test Area
   Description: streetlight problem in our street, and water problem in our area
   Deadline: within 1 month
   ```

5. **Click:** "🔍 Analyze & Split Complaint"

6. **Verify preview shows:**
   - Problem 1 → Electricity
   - Problem 2 → Water Supply
   - Both with deadline "within 1 month"

7. **Click:** "✅ Submit Complaints"

8. **Verify success:**
   - Complaint ID generated (e.g., GRV-2025-011)
   - Can view status

9. **Check Collector Dashboard:**
   - Login with COL-001
   - Should see 2 separate issues
   - Both status: Pending
   - One routed to Electricity
   - One routed to Water Supply

---

## ✅ Summary

**What Changed:**
- Added two-step flow: Analyze → Preview → Submit
- Created `/api/complaints/analyze` endpoint (no DB save)
- Updated `/api/complaints/submit` to accept pre-analyzed issues
- Added edit functionality to return to form
- Enhanced UI with preview display

**What Stayed the Same:**
- OTP verification (unchanged)
- Database schema (unchanged)
- Collector Dashboard (unchanged)
- AI analysis logic (unchanged)
- Final database structure (unchanged)

**Result:**
- ✅ Citizens can preview AI analysis before submitting
- ✅ Edit option for corrections
- ✅ Clearer transparency in routing
- ✅ Better user experience

---

**Status:** ✅ Complete and Ready for Testing
**Last Updated:** September 9, 2026