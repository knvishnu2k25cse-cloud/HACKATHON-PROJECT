require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { db, initDB, seedData } = require('./db');
const { analyzeText } = require('./ai');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// File upload config
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/tiff', 'application/pdf'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type. Only PNG, JPEG, TIFF, PDF allowed.'));
  }
});

// Server startup is handled at the bottom


// ==================== OTP ROUTES ====================

app.post('/api/otp/send', (req, res) => {
  const { aadhaar } = req.body;
  
  if (!aadhaar || !/^\d{12}$/.test(aadhaar)) {
    return res.status(400).json({ error: 'Invalid Aadhaar number. Must be exactly 12 digits.' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  db.prepare('INSERT OR REPLACE INTO otp_store (aadhaar, otp, created_at, verified) VALUES (?, ?, CURRENT_TIMESTAMP, 0)')
    .run(aadhaar, otp);

  res.json({ 
    success: true, 
    message: 'OTP sent to your registered mobile number',
    demo_otp: otp // Shown in demo mode
  });
});

app.post('/api/otp/verify', (req, res) => {
  const { aadhaar, otp } = req.body;

  if (!aadhaar || !otp) {
    return res.status(400).json({ error: 'Aadhaar and OTP are required.' });
  }

  const record = db.prepare('SELECT * FROM otp_store WHERE aadhaar = ?').get(aadhaar);
  
  if (!record) {
    return res.status(400).json({ error: 'No OTP was sent for this Aadhaar. Please request OTP first.' });
  }

  // Check OTP expiry (5 minutes)
  const createdDateStr = record.created_at.endsWith('Z') ? record.created_at : record.created_at.replace(' ', 'T') + 'Z';
  const createdAt = new Date(createdDateStr).getTime();
  if (Date.now() - createdAt > 5 * 60 * 1000) {
    return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
  }

  if (record.otp !== otp) {
    return res.status(400).json({ error: 'Invalid OTP. Please try again.' });
  }

  db.prepare('UPDATE otp_store SET verified = 1 WHERE aadhaar = ?').run(aadhaar);
  
  res.json({ success: true, message: 'Identity verified successfully!' });
});

// ==================== COMPLAINT ROUTES ====================

// NEW: Analyze complaint (preview only, no database save)
app.post('/api/complaints/analyze', async (req, res) => {
  try {
    const { description, deadline } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Complaint description is required.' });
    }

    // AI Analysis ONLY - no database operations
    const analysis = await analyzeText(description.trim(), 'citizen');

    // Use citizen-provided deadline for all issues
    const citizenDeadline = deadline && deadline.trim() ? deadline.trim() : 'Not specified';

    // Return analyzed issues (no complaint_id yet)
    res.json({
      success: true,
      issues: analysis.issues.map(issue => ({
        department: issue.department,
        issue_text: issue.issue_text,
        deadline: citizenDeadline,
        priority: issue.priority
      }))
    });
  } catch (error) {
    console.error('Complaint analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze complaint. Please try again.' });
  }
});

app.post('/api/complaints/submit', async (req, res) => {
  try {
    const { name, location, description, deadline, aadhaar, analyzedIssues } = req.body;

    if (!name || !location || !description) {
      return res.status(400).json({ error: 'Name, location, and description are required.' });
    }

    if (!description.trim()) {
      return res.status(400).json({ error: 'Complaint description cannot be empty.' });
    }

    // Verify Aadhaar was validated
    if (aadhaar) {
      const otpRecord = db.prepare('SELECT * FROM otp_store WHERE aadhaar = ? AND verified = 1').get(aadhaar);
      if (!otpRecord) {
        return res.status(400).json({ error: 'Aadhaar identity not verified. Please complete OTP verification.' });
      }
    }

    // Generate complaint ID
    const count = db.prepare('SELECT COUNT(*) as cnt FROM complaints').get().cnt;
    const complaintId = `GRV-2025-${String(count + 1).padStart(3, '0')}`;

    // Use pre-analyzed issues if provided, otherwise analyze now
    let issues;
    if (analyzedIssues && Array.isArray(analyzedIssues) && analyzedIssues.length > 0) {
      issues = analyzedIssues;
    } else {
      // Fallback: analyze if not pre-analyzed
      const analysis = await analyzeText(description, 'citizen');
      const citizenDeadline = deadline && deadline.trim() ? deadline.trim() : null;
      issues = analysis.issues.map(issue => ({
        ...issue,
        deadline: citizenDeadline || issue.deadline
      }));
    }

    // Store complaint
    db.prepare('INSERT INTO complaints (id, source, citizen_name, citizen_location, original_text, aadhaar_hash) VALUES (?, ?, ?, ?, ?, ?)')
      .run(complaintId, 'citizen', name, location, description, aadhaar ? aadhaar.substring(0, 4) + '****' + aadhaar.substring(8) : null);

    // Store issues
    const insertIssue = db.prepare('INSERT INTO issues (complaint_id, department, issue_text, deadline, priority) VALUES (?, ?, ?, ?, ?)');
    
    const insertAll = db.transaction((issueList) => {
      for (const issue of issueList) {
        insertIssue.run(complaintId, issue.department, issue.issue_text, issue.deadline, issue.priority);
      }
    });

    insertAll(issues);

    res.json({
      success: true,
      complaint_id: complaintId,
      source: 'citizen',
      issues: issues.map((issue, idx) => ({
        ...issue,
        status: 'Pending',
        id: idx
      }))
    });
  } catch (error) {
    console.error('Complaint submission error:', error);
    res.status(500).json({ error: 'Failed to process complaint. Please try again.' });
  }
});

// ==================== COLLECTOR ORDER ROUTES ====================

app.post('/api/collector/submit-text', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Order text cannot be empty.' });
    }

    const count = db.prepare('SELECT COUNT(*) as cnt FROM complaints').get().cnt;
    const complaintId = `GRV-2025-${String(count + 1).padStart(3, '0')}`;

    const analysis = await analyzeText(text, 'collector_order');

    db.prepare('INSERT INTO complaints (id, source, citizen_name, citizen_location, original_text) VALUES (?, ?, ?, ?, ?)')
      .run(complaintId, 'collector_order', null, 'District Collector Office', text);

    const insertIssue = db.prepare('INSERT INTO issues (complaint_id, department, issue_text, deadline, priority) VALUES (?, ?, ?, ?, ?)');
    const insertAll = db.transaction((issues) => {
      for (const issue of issues) {
        insertIssue.run(complaintId, issue.department, issue.issue_text, issue.deadline, issue.priority);
      }
    });
    insertAll(analysis.issues);

    res.json({
      success: true,
      complaint_id: complaintId,
      source: 'collector_order',
      issues: analysis.issues.map((issue, idx) => ({
        ...issue,
        status: 'Pending',
        id: idx
      }))
    });
  } catch (error) {
    console.error('Collector order submission error:', error);
    res.status(500).json({ error: 'Failed to process order. Please try again.' });
  }
});

app.post('/api/collector/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    // OCR with Tesseract.js
    const Tesseract = require('tesseract.js');

    const { data: { text } } = await Tesseract.recognize(
      req.file.path,
      'eng'
    );

    // Clean up uploaded file
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Could not extract text from the uploaded file. Please try pasting the text directly.' });
    }

    const count = db.prepare('SELECT COUNT(*) as cnt FROM complaints').get().cnt;
    const complaintId = `GRV-2025-${String(count + 1).padStart(3, '0')}`;

    const analysis = await analyzeText(text.trim(), 'collector_order');

    db.prepare('INSERT INTO complaints (id, source, citizen_name, citizen_location, original_text) VALUES (?, ?, ?, ?, ?)')
      .run(complaintId, 'collector_order', null, 'District Collector Office', text.trim());

    const insertIssue = db.prepare('INSERT INTO issues (complaint_id, department, issue_text, deadline, priority) VALUES (?, ?, ?, ?, ?)');
    const insertAll = db.transaction((issues) => {
      for (const issue of issues) {
        insertIssue.run(complaintId, issue.department, issue.issue_text, issue.deadline, issue.priority);
      }
    });
    insertAll(analysis.issues);

    res.json({
      success: true,
      complaint_id: complaintId,
      source: 'collector_order',
      extracted_text: text.trim().substring(0, 500),
      issues: analysis.issues.map((issue, idx) => ({
        ...issue,
        status: 'Pending',
        id: idx
      }))
    });
  } catch (error) {
    console.error('File upload/OCR error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to process uploaded file. Please try again.' });
  }
});

// ==================== DASHBOARD ROUTES ====================

// Department Dashboard
app.get('/api/dashboard/department/:department', (req, res) => {
  const { department } = req.params;
  
  const issues = db.prepare(`
    SELECT i.*, c.source, c.citizen_name, c.citizen_location, c.created_at as complaint_date 
    FROM issues i 
    JOIN complaints c ON i.complaint_id = c.id 
    WHERE i.department = ? 
    ORDER BY 
      CASE WHEN i.priority = 'High' THEN 0 ELSE 1 END,
      CASE WHEN i.status = 'Pending' THEN 0 ELSE 1 END,
      i.created_at DESC
  `).all(department);

  res.json({ department, issues });
});

// All departments list
app.get('/api/departments', (req, res) => {
  const departments = [
    'Water Supply', 'Roads & Infrastructure', 'Electricity', 'Sanitation',
    'Health', 'Education', 'Revenue/Land Records', 'General Administration'
  ];

  const stats = departments.map(dept => {
    const total = db.prepare('SELECT COUNT(*) as cnt FROM issues WHERE department = ?').get(dept).cnt;
    const pending = db.prepare('SELECT COUNT(*) as cnt FROM issues WHERE department = ? AND status = ?').get(dept, 'Pending').cnt;
    const highPriority = db.prepare('SELECT COUNT(*) as cnt FROM issues WHERE department = ? AND priority = ?').get(dept, 'High').cnt;
    return { department: dept, total, pending, resolved: total - pending, highPriority };
  });

  res.json({ departments: stats });
});

// Collector Dashboard
app.get('/api/dashboard/collector', (req, res) => {
  const allIssues = db.prepare(`
    SELECT i.*, c.source, c.citizen_name, c.citizen_location, c.created_at as complaint_date 
    FROM issues i 
    JOIN complaints c ON i.complaint_id = c.id 
    ORDER BY 
      CASE WHEN i.priority = 'High' THEN 0 ELSE 1 END,
      CASE WHEN i.status = 'Pending' THEN 0 ELSE 1 END,
      i.created_at DESC
  `).all();

  const totalComplaints = db.prepare('SELECT COUNT(*) as cnt FROM complaints').get().cnt;
  const totalIssues = allIssues.length;
  const pending = allIssues.filter(i => i.status === 'Pending').length;
  const resolved = allIssues.filter(i => i.status === 'Resolved').length;
  const highPriority = allIssues.filter(i => i.priority === 'High' && i.status === 'Pending').length;

  // Department breakdown
  const deptBreakdown = {};
  allIssues.forEach(issue => {
    if (!deptBreakdown[issue.department]) {
      deptBreakdown[issue.department] = { total: 0, pending: 0, resolved: 0, high: 0 };
    }
    deptBreakdown[issue.department].total++;
    if (issue.status === 'Pending') deptBreakdown[issue.department].pending++;
    else deptBreakdown[issue.department].resolved++;
    if (issue.priority === 'High') deptBreakdown[issue.department].high++;
  });

  res.json({
    stats: { totalComplaints, totalIssues, pending, resolved, highPriority },
    departmentBreakdown: deptBreakdown,
    issues: allIssues
  });
});

// Resolve issue
app.post('/api/issues/:id/resolve', (req, res) => {
  const { id } = req.params;
  const { resolution_note } = req.body;

  const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(id);
  if (!issue) {
    return res.status(404).json({ error: 'Issue not found.' });
  }

  db.prepare('UPDATE issues SET status = ?, resolution_note = ?, resolved_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run('Resolved', resolution_note || 'Resolved', id);

  res.json({ success: true, message: 'Issue marked as resolved.' });
});

// Status Tracker
app.get('/api/status/:complaintId', (req, res) => {
  const { complaintId } = req.params;

  const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(complaintId);
  
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found. Please check the Complaint ID.' });
  }

  const issues = db.prepare('SELECT * FROM issues WHERE complaint_id = ? ORDER BY created_at').all(complaintId);

  res.json({
    complaint_id: complaint.id,
    source: complaint.source,
    citizen_name: complaint.citizen_name,
    location: complaint.citizen_location,
    original_text: complaint.original_text,
    submitted_at: complaint.created_at,
    issues: issues.map(i => ({
      id: i.id,
      department: i.department,
      issue_text: i.issue_text,
      deadline: i.deadline,
      priority: i.priority,
      status: i.status,
      resolution_note: i.resolution_note,
      resolved_at: i.resolved_at
    }))
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  res.status(500).json({ error: 'Internal server error.' });
});

async function startServer() {
  try {
    await initDB();
    seedData();
    app.listen(PORT, () => {
      console.log(`🚀 Grievance System Backend running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();