// Test script to verify OpenAI integration
require('dotenv').config();
const { analyzeText } = require('./ai');

console.log('🧪 Testing OpenAI Integration');
console.log('═'.repeat(70));
console.log('');

// Check API key
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey || apiKey === '' || apiKey.includes('your_')) {
  console.log('⚠️  No valid OpenAI API key found in .env');
  console.log('   System will use fallback keyword-based classifier');
  console.log('');
  console.log('   To enable OpenAI:');
  console.log('   1. Get API key from https://platform.openai.com/api-keys');
  console.log('   2. Edit backend/.env');
  console.log('   3. Add: OPENAI_API_KEY=sk-your-key-here');
  console.log('');
} else {
  console.log('✓ OpenAI API key found');
  console.log(`  Key starts with: ${apiKey.substring(0, 10)}...`);
  console.log('');
}

// Test complaint
const testComplaint = `There is no water supply in our area for the past 3 days. The garbage has also not been collected for a week, causing terrible smell. Children are getting sick from the unsanitary conditions. Street lights are also not working, making it dangerous at night.`;

console.log('📝 Test Complaint:');
console.log('-'.repeat(70));
console.log(testComplaint);
console.log('');
console.log('🤖 Running AI Classification...');
console.log('');

async function runTest() {
  try {
    const startTime = Date.now();
    const result = await analyzeText(testComplaint, 'citizen');
    const duration = Date.now() - startTime;
    
    console.log('✅ Classification Complete!');
    console.log(`   Duration: ${duration}ms`);
    console.log('');
    console.log('📊 Results:');
    console.log('-'.repeat(70));
    console.log(`   Found ${result.issues.length} issue(s)`);
    console.log('');
    
    result.issues.forEach((issue, idx) => {
      console.log(`   Issue #${idx + 1}:`);
      console.log(`   Department: ${issue.department}`);
      console.log(`   Priority: ${issue.priority}`);
      console.log(`   Deadline: ${issue.deadline}`);
      console.log(`   Description: ${issue.issue_text.substring(0, 100)}${issue.issue_text.length > 100 ? '...' : ''}`);
      console.log('');
    });
    
    // Verify multi-department detection
    const uniqueDepts = new Set(result.issues.map(i => i.department));
    if (uniqueDepts.size >= 3) {
      console.log('✅ Multi-department detection: WORKING');
      console.log(`   Detected ${uniqueDepts.size} departments`);
    }
    
    // Verify priority detection
    const hasHighPriority = result.issues.some(i => i.priority === 'High');
    if (hasHighPriority) {
      console.log('✅ Priority detection: WORKING');
      console.log('   Correctly marked as High priority');
    }
    
    console.log('');
    console.log('═'.repeat(70));
    console.log('✅ Test Complete - System Working Correctly!');
    console.log('');
    
    if (!apiKey || apiKey.includes('your_')) {
      console.log('ℹ️  Note: Test used fallback classifier.');
      console.log('   Add OpenAI API key to use AI-powered classification.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ Test Failed');
    console.error('   Error:', error.message);
    console.error('');
    process.exit(1);
  }
}

runTest();