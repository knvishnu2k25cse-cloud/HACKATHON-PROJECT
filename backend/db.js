const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'grievance.db');
let rawDb = null;

function saveDb() {
  if (!rawDb) return;
  try {
    const data = rawDb.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  } catch (e) {
    console.error('Error saving db:', e);
  }
}

const db = {
  pragma(sql) {
    if (!rawDb) return;
    try {
      rawDb.run(`PRAGMA ${sql};`);
    } catch (e) {}
  },
  exec(sql) {
    if (!rawDb) throw new Error('DB not initialized');
    rawDb.exec(sql);
    saveDb();
  },
  prepare(sql) {
    return {
      get(...params) {
        if (!rawDb) throw new Error('DB not initialized');
        const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        const stmt = rawDb.prepare(sql);
        try {
          if (flatParams.length > 0) stmt.bind(flatParams);
          if (stmt.step()) return stmt.getAsObject();
          return undefined;
        } finally {
          stmt.free();
        }
      },
      all(...params) {
        if (!rawDb) throw new Error('DB not initialized');
        const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        const stmt = rawDb.prepare(sql);
        const results = [];
        try {
          if (flatParams.length > 0) stmt.bind(flatParams);
          while (stmt.step()) {
            results.push(stmt.getAsObject());
          }
          return results;
        } finally {
          stmt.free();
        }
      },
      run(...params) {
        if (!rawDb) throw new Error('DB not initialized');
        const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        rawDb.run(sql, flatParams);
        saveDb();
        return { changes: rawDb.getRowsModified() };
      }
    };
  },
  transaction(fn) {
    return (...args) => {
      if (!rawDb) throw new Error('DB not initialized');
      rawDb.exec('BEGIN TRANSACTION;');
      try {
        const result = fn(...args);
        rawDb.exec('COMMIT;');
        saveDb();
        return result;
      } catch (err) {
        rawDb.exec('ROLLBACK;');
        throw err;
      }
    };
  }
};

async function initDB() {
  const SQL = await initSqlJs();
  if (fs.existsSync(dbPath)) {
    try {
      const fileBuffer = fs.readFileSync(dbPath);
      rawDb = new SQL.Database(fileBuffer);
    } catch (e) {
      console.warn('Could not load existing db file, creating new:', e.message);
      rawDb = new SQL.Database();
    }
  } else {
    rawDb = new SQL.Database();
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS complaints (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL CHECK(source IN ('citizen', 'collector_order')),
      citizen_name TEXT,
      citizen_location TEXT,
      original_text TEXT NOT NULL,
      aadhaar_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS issues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id TEXT NOT NULL,
      department TEXT NOT NULL,
      issue_text TEXT NOT NULL,
      deadline TEXT,
      priority TEXT NOT NULL DEFAULT 'Normal' CHECK(priority IN ('High', 'Normal')),
      status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'Resolved')),
      resolution_note TEXT,
      resolved_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id)
    );

    CREATE TABLE IF NOT EXISTS otp_store (
      aadhaar TEXT PRIMARY KEY,
      otp TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      verified INTEGER DEFAULT 0
    );
  `);
}

function seedData() {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM complaints').get();
  if (count && count.cnt > 0) return;

  const sampleData = [
    {
      id: 'GRV-2025-001',
      source: 'citizen',
      citizen_name: 'Ramesh Kumar',
      citizen_location: 'Sector 15, Chandigarh',
      original_text: 'There has been no water supply in our area for the past 3 days. The main pipeline seems to be broken near the community park. Residents are struggling to get drinking water.',
      issues: [
        { department: 'Water Supply', issue_text: 'No water supply for 3 days due to broken main pipeline near community park in Sector 15. Residents struggling for drinking water.', deadline: 'Immediate', priority: 'High' }
      ]
    },
    {
      id: 'GRV-2025-002',
      source: 'citizen',
      citizen_name: 'Priya Sharma',
      citizen_location: 'MG Road, Pune',
      original_text: 'The road near MG Road junction has developed massive potholes after recent rains. Two accidents have already happened. Also, the street lights are not working making it dangerous at night.',
      issues: [
        { department: 'Roads & Infrastructure', issue_text: 'Massive potholes on MG Road junction after rains. Two accidents already occurred.', deadline: '48 hours', priority: 'High' },
        { department: 'Electricity', issue_text: 'Street lights not working near MG Road junction, creating dangerous conditions at night.', deadline: '24 hours', priority: 'Normal' }
      ]
    },
    {
      id: 'GRV-2025-003',
      source: 'collector_order',
      citizen_name: null,
      citizen_location: 'District Office, Nagpur',
      original_text: 'Order No. DC/2025/147: In view of the upcoming monsoon season, all departments are directed to take immediate preventive measures. Water Supply dept to clean all storm drains. Roads dept to fill potholes on all major roads. Health dept to begin anti-dengue fogging in all wards. Deadline: 15 days from date of order.',
      issues: [
        { department: 'Water Supply', issue_text: 'Clean all storm drains as preventive measure for upcoming monsoon season. (Collector Order DC/2025/147)', deadline: '15 days', priority: 'High' },
        { department: 'Roads & Infrastructure', issue_text: 'Fill potholes on all major roads before monsoon season. (Collector Order DC/2025/147)', deadline: '15 days', priority: 'High' },
        { department: 'Health', issue_text: 'Begin anti-dengue fogging in all wards as monsoon prevention. (Collector Order DC/2025/147)', deadline: '15 days', priority: 'High' }
      ]
    },
    {
      id: 'GRV-2025-004',
      source: 'citizen',
      citizen_name: 'Suresh Patil',
      citizen_location: 'Andheri East, Mumbai',
      original_text: 'Garbage has not been collected from our lane for over a week. The pile is growing and causing a terrible stench. There are concerns about health hazards especially for children playing in the area.',
      issues: [
        { department: 'Sanitation', issue_text: 'Garbage not collected for over a week in Andheri East lane. Growing pile causing stench and health hazards for children.', deadline: 'Immediate', priority: 'Normal' },
        { department: 'Health', issue_text: 'Health hazard from uncollected garbage pile, especially for children in the area.', deadline: 'Immediate', priority: 'Normal' }
      ]
    },
    {
      id: 'GRV-2025-005',
      source: 'citizen',
      citizen_name: 'Fatima Begum',
      citizen_location: 'Old City, Hyderabad',
      original_text: 'A building in our neighborhood is showing severe cracks and looks like it could collapse any moment. Around 20 families live in this building. This is a life threatening situation and needs urgent attention.',
      issues: [
        { department: 'General Administration', issue_text: 'Building showing severe cracks with collapse risk. 20 families at risk. Life threatening situation requiring urgent evacuation and structural assessment.', deadline: 'Immediate', priority: 'High' }
      ]
    },
    {
      id: 'GRV-2025-006',
      source: 'collector_order',
      citizen_name: null,
      citizen_location: 'District Office, Jaipur',
      original_text: 'Order No. DC/2025/203: Following multiple complaints regarding land encroachment near the new highway corridor, the Revenue department is directed to conduct a survey and submit report within 7 days. General Administration to coordinate with police for any necessary enforcement.',
      issues: [
        { department: 'Revenue/Land Records', issue_text: 'Conduct survey of land encroachment near new highway corridor and submit report. (Collector Order DC/2025/203)', deadline: '7 days', priority: 'Normal' },
        { department: 'General Administration', issue_text: 'Coordinate with police for enforcement regarding land encroachment near highway corridor. (Collector Order DC/2025/203)', deadline: '7 days', priority: 'Normal' }
      ]
    },
    {
      id: 'GRV-2025-007',
      source: 'citizen',
      citizen_name: 'Anil Verma',
      citizen_location: 'Civil Lines, Lucknow',
      original_text: 'The government primary school in our ward has a leaking roof and no electricity. Children are studying in the dark during cloudy days. The toilet facilities are also broken and unusable.',
      issues: [
        { department: 'Education', issue_text: 'Government primary school has leaking roof. Children studying in dark during cloudy days.', deadline: '1 week', priority: 'Normal' },
        { department: 'Electricity', issue_text: 'No electricity in government primary school in Civil Lines ward.', deadline: '3 days', priority: 'Normal' },
        { department: 'Sanitation', issue_text: 'Broken and unusable toilet facilities at government primary school.', deadline: '1 week', priority: 'Normal' }
      ]
    },
    {
      id: 'GRV-2025-008',
      source: 'citizen',
      citizen_name: 'Meena Devi',
      citizen_location: 'Flood-affected area, Patna',
      original_text: 'Our entire locality is flooded. Water has entered homes. We need urgent medical help as several elderly people and children are sick. There is no clean drinking water and no electricity. This is a medical emergency.',
      issues: [
        { department: 'Water Supply', issue_text: 'No clean drinking water in flood-affected locality. Urgent supply needed.', deadline: 'Immediate', priority: 'High' },
        { department: 'Health', issue_text: 'Medical emergency: elderly and children sick in flooded area. Urgent medical teams needed.', deadline: 'Immediate', priority: 'High' },
        { department: 'Electricity', issue_text: 'Complete power outage in flood-affected area of Patna.', deadline: 'Immediate', priority: 'High' },
        { department: 'General Administration', issue_text: 'Flood rescue and relief needed. Water entered homes in locality.', deadline: 'Immediate', priority: 'High' }
      ]
    },
    {
      id: 'GRV-2025-009',
      source: 'collector_order',
      citizen_name: null,
      citizen_location: 'District Office, Bhopal',
      original_text: 'Order No. DC/2025/089: The Education department is directed to ensure all mid-day meal programs are running in government schools. Inspection reports to be submitted within 10 days.',
      issues: [
        { department: 'Education', issue_text: 'Ensure all mid-day meal programs running in government schools. Submit inspection reports. (Collector Order DC/2025/089)', deadline: '10 days', priority: 'Normal' }
      ]
    },
    {
      id: 'GRV-2025-010',
      source: 'citizen',
      citizen_name: 'Vikram Singh',
      citizen_location: 'Industrial Area, Ahmedabad',
      original_text: 'There is continuous illegal dumping of industrial waste in the vacant plot next to our residential colony. The chemicals are seeping into the ground and our borewell water has turned yellowish. Children in the area are getting skin rashes.',
      issues: [
        { department: 'Sanitation', issue_text: 'Illegal industrial waste dumping in vacant plot next to residential colony in Industrial Area, Ahmedabad.', deadline: '48 hours', priority: 'High' },
        { department: 'Health', issue_text: 'Chemical contamination causing skin rashes in children. Borewell water turned yellowish from industrial waste seepage.', deadline: 'Immediate', priority: 'High' },
        { department: 'Water Supply', issue_text: 'Borewell water contaminated (turned yellowish) due to industrial chemical seepage. Alternative water supply needed.', deadline: 'Immediate', priority: 'High' }
      ]
    }
  ];

  const insertComplaint = db.prepare(`
    INSERT INTO complaints (id, source, citizen_name, citizen_location, original_text)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertIssue = db.prepare(`
    INSERT INTO issues (complaint_id, department, issue_text, deadline, priority)
    VALUES (?, ?, ?, ?, ?)
  `);

  const seedTransaction = db.transaction(() => {
    for (const complaint of sampleData) {
      insertComplaint.run(
        complaint.id,
        complaint.source,
        complaint.citizen_name,
        complaint.citizen_location,
        complaint.original_text
      );
      for (const issue of complaint.issues) {
        insertIssue.run(
          complaint.id,
          issue.department,
          issue.issue_text,
          issue.deadline,
          issue.priority
        );
      }
    }
  });

  seedTransaction();
  console.log('✅ Seeded 10 sample complaints/orders');
}

module.exports = { db, initDB, seedData };