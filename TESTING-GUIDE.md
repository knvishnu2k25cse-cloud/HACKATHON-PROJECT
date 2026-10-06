# 🧪 Testing Guide - GrievanceAI Application

## 🚀 Starting the Application

### Step 1: Start Backend
```bash
cd /home/vishnu/Desktop/HACKTHON/grievance-system/backend
node server.js
```

**Expected Output:**
```
🚀 Grievance System Backend running on http://localhost:3001
```

### Step 2: Start Frontend (New Terminal)
```bash
cd /home/vishnu/Desktop/HACKTHON/grievance-system/frontend
REACT_APP_API_URL=http://localhost:3001 npm start
```

**Browser should auto-open to:** http://localhost:3000

---

## ✅ Test 1: Citizen Flow (OTP Bug Fix Test)

### Objective: Verify OTP verification works correctly

1. **Open Home Page:** http://localhost:3000
2. **Click the "Citizen" card** (left side, blue gradient)
3. **Enter Aadhaar Number:** `123456789012` (any 12 digits work)
4. **Click "Send OTP" button**
5. **Observe:** OTP appears on screen in yellow box (e.g., `123456`)
6. **Copy the 6-digit OTP** shown on screen
7. **Paste/Type the OTP** in the input field
8. **Click "Verify" button**

**✅ Expected Result:**
- Green checkmark appears
- Message: "Identity verified successfully!"
- Complaint form unlocks below
- **NO "OTP mismatch" error**

**❌ If OTP verification fails:**
- Check that you entered exactly 6 digits
- Check that the OTP matches what's displayed
- Try a fresh Aadhaar number

---

## ✅ Test 2: Citizen Complaint with Deadline

### Objective: Verify deadline field works

**Continue from Test 1 after OTP verification:**

9. **Fill Complaint Form:**
   - **Full Name:** `Test User`
   - **Location:** `Test Area, Test City`
   - **Complaint Description:**
     ```
     Water pipeline is broken causing no supply for 3 days. 
     Garbage has not been collected for a week causing health issues. 
     Street lights are not working making it dangerous at night.
     ```
   - **Expected Deadline:** `Within 7 days` ← **NEW FIELD**

10. **Click "Submit Complaint" button**
11. **Wait for AI Analysis** (2-3 seconds)

**✅ Expected Result:**
- Success screen with Complaint ID (e.g., `GRV-2025-011`)
- Issues split into 3-4 departments:
  - Water Supply
  - Sanitation
  - Electricity
  - Health (maybe)
- All issues show deadline: "Within 7 days"
- Priority marked as High (3+ departments)

12. **Save the Complaint ID** for later testing

---

## ✅ Test 3: Collector Login

### Objective: Verify Collector ID authentication

1. **Go back to Home:** Click Home in nav or go to http://localhost:3000
2. **Click the "Collector" card** (right side, purple gradient)
3. **Try Invalid ID first:**
   - Enter: `INVALID`
   - Click "Login to Dashboard"
   - **Expected:** Error message shows with valid IDs

4. **Try Valid ID:**
   - Enter: `COL-001` (or click the button below)
   - Click "Login to Dashboard"
   - **Expected:** Redirects to Collector Dashboard

**Valid Demo IDs:** `COL-001`, `COL-002`, `COL-003`

---

## ✅ Test 4: Collector Dashboard - Clickable Detail View

### Objective: Verify issue cards are clickable and show full details

**On the Collector Dashboard:**

1. **Observe Summary Stats:**
   - Total Complaints
   - Total Issues
   - Pending count
   - Resolved count
   - High Priority count

2. **Observe Department Breakdown:**
   - All 8 departments shown
   - Progress bars for each
   - Stats: total, pending, resolved

3. **Observe High Priority Alerts Section** (if any high priority pending)

4. **Test Filters:**
   - Click "All Issues" - shows everything
   - Click "Pending" - shows only pending
   - Click "Resolved" - shows only resolved
   - Click "High Priority" - shows only high priority pending

5. **Click Any Issue Card** ← **MAIN TEST**
   - Click anywhere on a card (not just a button)
   - **Expected:** Modal opens showing:
     - ✅ Full complaint description (not truncated)
     - ✅ Complaint ID
     - ✅ Source (Citizen or Collector Order)
     - ✅ Citizen name (if citizen complaint)
     - ✅ Location/address
     - ✅ Submitted date and time
     - ✅ Deadline
     - ✅ Department
     - ✅ Current status badge
     - ✅ Priority badge
     - ✅ Resolution note (if resolved)

6. **Test Modal Interactions:**
   - Try clicking outside modal → Should close
   - Reopen modal
   - Click X button → Should close

---

## ✅ Test 5: Resolve Issue from Detail View

### Objective: Verify resolve functionality in modal

1. **Open a PENDING issue** (click its card)
2. **In the modal, look for "Mark as Resolved" button**
3. **Click "Mark as Resolved"**
4. **Resolution form appears:**
   - Optional text input for resolution note
   - "Confirm Resolution" button
   - "Cancel" button

5. **Try Cancel:**
   - Click "Cancel"
   - Form hides, back to detail view

6. **Click "Mark as Resolved" again**
7. **Add a note:** `Issue fixed on site`
8. **Click "Confirm Resolution"**

**✅ Expected Result:**
- Button shows "Saving..."
- Modal updates to show "Resolved" status
- Dashboard refreshes automatically
- Issue now appears in "Resolved" filter
- Modal shows resolution note and resolved date

---

## ✅ Test 6: Status Tracker

### Objective: Verify citizens can track their complaints

1. **Click "Track Status" in navigation**
2. **Enter the Complaint ID** from Test 2 (e.g., `GRV-2025-011`)
3. **Click "Track Complaint"**

**✅ Expected Result:**
- Shows complaint details
- Shows citizen name and location
- Shows original description
- Lists all routed issues by department
- Shows deadline for each issue
- Shows status (Pending/Resolved) for each
- Shows priority badges

4. **Try a pre-seeded ID:** `GRV-2025-008` (flood emergency)
   - Should show high priority
   - Multiple departments

---

## ✅ Test 7: Navigation Simplicity

### Objective: Verify clean navigation

**Check Navigation Bar:**
- ✅ Only 2 items: Home, Track Status
- ❌ No "File Complaint" link
- ❌ No "Collector Orders" link
- ❌ No "Department" link
- ❌ No "Collector Dashboard" link

**Home Page:**
- ✅ Only 2 main cards: Citizen, Collector
- ✅ How It Works section
- ✅ Demo notice at bottom

---

## 🐛 Known Issues & Troubleshooting

### Issue: OTP Still Fails
**Solution:**
1. Open browser console (F12)
2. Check for errors
3. Try a different Aadhaar number
4. Refresh page and try again
5. Check backend console for OTP value

### Issue: Modal Doesn't Open
**Solution:**
1. Check browser console for React errors
2. Refresh page
3. Try clicking different issue cards

### Issue: Dashboard Shows No Data
**Solution:**
1. Check backend is running on port 3001
2. Check browser console for API errors
3. Verify database exists: `ls backend/grievance.db`
4. Restart backend to reseed database

### Issue: Deadline Not Showing
**Solution:**
1. Check that you filled the deadline field in complaint form
2. Backend should log the deadline value
3. Refresh Collector Dashboard

---

## 📊 Pre-Seeded Test Data

Try these Complaint IDs in Status Tracker:

- `GRV-2025-001` - Water supply outage (High priority)
- `GRV-2025-002` - Roads + Electricity (Multi-department)
- `GRV-2025-003` - Collector order (3 departments)
- `GRV-2025-008` - **FLOOD EMERGENCY** (4 departments, High priority)
- `GRV-2025-010` - Industrial contamination (3 departments, High)

---

## ✅ Complete Test Checklist

- [ ] Backend starts successfully
- [ ] Frontend starts successfully
- [ ] Home page shows only 2 cards
- [ ] Navigation shows only Home + Track Status
- [ ] Citizen card redirects to /citizen
- [ ] Collector card redirects to /collector (login)
- [ ] OTP verification works correctly
- [ ] Deadline field is present and required
- [ ] Complaint submission succeeds
- [ ] AI splits multi-department issues
- [ ] Collector ID validation works
- [ ] Valid ID redirects to dashboard
- [ ] Dashboard shows all stats correctly
- [ ] All filters work (All, Pending, Resolved, High)
- [ ] Issue cards are clickable
- [ ] Detail modal opens with all information
- [ ] Modal can be closed (X button and click outside)
- [ ] Pending issues show "Mark as Resolved" button
- [ ] Resolve functionality works
- [ ] Dashboard refreshes after resolve
- [ ] Status Tracker works with new complaints
- [ ] Status Tracker works with pre-seeded data

---

## 🎉 Success Criteria

All tests pass if:

1. ✅ OTP verification succeeds every time (no mismatch errors)
2. ✅ Deadline field is mandatory and saves correctly
3. ✅ Collector login requires valid ID
4. ✅ Issue cards are fully clickable
5. ✅ Detail modal shows complete information
6. ✅ Resolve action works from modal
7. ✅ Navigation is clean (only 2 items)
8. ✅ Home page is simple (only 2 cards)
9. ✅ No Department Dashboard in navigation
10. ✅ Complete flow works: Citizen → OTP → Submit → Collector → View → Resolve

---

**Happy Testing! 🚀**