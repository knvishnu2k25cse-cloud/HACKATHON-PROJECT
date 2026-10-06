// Quick test to verify all backend dependencies and database setup
const path = require('path');

console.log('🧪 Testing backend setup...');
console.log('');

try {
  console.log('✓ Loading dependencies...');
  require('express');
  require('cors');
  require('better-sqlite3');
  require('multer');
  require('uuid');
  require('tesseract.js');
  console.log('  ✓ All core packages loaded');
  
  console.log('');
  console.log('✓ Testing database...');
  const { initDB, seedData, db } = require('./db');
  initDB();
  console.log('  ✓ Database initialized');
  
  seedData();
  const count = db.prepare('SELECT COUNT(*) as cnt FROM complaints').get();
  console.log(`  ✓ Database seeded with ${count.cnt} sample complaints`);
  
  const issues = db.prepare('SELECT COUNT(*) as cnt FROM issues').get();
  console.log(`  ✓ ${issues.cnt} total issues in database`);
  
  console.log('');
  console.log('✓ Testing OpenAI client...');
  try {
    const { OpenAI } = require('openai');
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      console.log('  ⚠️  No valid OpenAI API key found in .env');
      console.log('  ℹ️  System will use fallback keyword-based classifier');
    } else {
      console.log('  ✓ OpenAI API key configured');
    }
  } catch (e) {
    console.log('  ⚠️  OpenAI package error:', e.message);
  }
  
  console.log('');
  console.log('✅ Backend setup test PASSED');
  console.log('');
  console.log('Ready to start with: node server.js');
  
  process.exit(0);
} catch (error) {
  console.error('');
  console.error('❌ Backend setup test FAILED');
  console.error('');
  console.error('Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}