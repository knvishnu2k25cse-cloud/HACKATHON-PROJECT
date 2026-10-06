const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000, // 30 second timeout
  maxRetries: 2,
});

const DEPARTMENTS = [
  'Water Supply',
  'Roads & Infrastructure',
  'Electricity',
  'Sanitation',
  'Health',
  'Education',
  'Revenue/Land Records',
  'General Administration'
];

const URGENCY_KEYWORDS = [
  'flood', 'collapse', 'fire', 'medical emergency', 'life threatening',
  'urgent', 'death', 'dying', 'explosion', 'earthquake', 'epidemic',
  'contamination', 'danger', 'hazardous', 'critical', 'immediate',
  'emergency', 'accident', 'fatal'
];

async function analyzeText(text, source) {
  // Check if API key is configured
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('your_') || process.env.OPENAI_API_KEY === '') {
    console.warn('⚠️  OpenAI API key not configured. Using fallback classifier.');
    return fallbackClassify(text);
  }

  const prompt = `You are a government grievance classification AI for Indian smart cities. Analyze the following ${source === 'collector_order' ? 'District Collector order' : 'citizen complaint'} and classify it.

DEPARTMENTS (use ONLY these exact names):
${DEPARTMENTS.map(d => `- ${d}`).join('\n')}

RULES:
1. If the text mentions issues belonging to MULTIPLE departments, SPLIT into separate sub-issues, each tagged to its correct department.
2. Extract any deadline or required action timeline mentioned.
3. Mark priority as "High" if:
   - Text contains urgency keywords (flood, collapse, fire, medical emergency, life threatening, urgent, etc.)
   - OR if the issue spans 3 or more departments
   Otherwise mark as "Normal".
4. For each sub-issue, write a clear, concise description.

TEXT TO ANALYZE:
"""
${text}
"""

Respond with ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "issues": [
    {
      "department": "exact department name from list",
      "issue_text": "clear description of the specific issue for this department",
      "deadline": "extracted deadline or 'Not specified'",
      "priority": "High" or "Normal"
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a government grievance classification system. Always respond with valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 1000,
    });

    const content = response.choices[0].message.content.trim();
    
    // Try to parse the JSON, handling potential markdown code blocks
    let jsonStr = content;
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    }
    
    const result = JSON.parse(jsonStr);
    
    // Validate that we have issues array
    if (!result.issues || !Array.isArray(result.issues) || result.issues.length === 0) {
      console.warn('⚠️  OpenAI returned invalid structure. Using fallback classifier.');
      return fallbackClassify(text);
    }
    
    // Validate departments and enforce priority rules
    const validIssues = result.issues.map(issue => ({
      department: DEPARTMENTS.includes(issue.department) ? issue.department : 'General Administration',
      issue_text: issue.issue_text || text.substring(0, 200),
      deadline: issue.deadline || 'Not specified',
      priority: issue.priority === 'High' ? 'High' : 'Normal'
    }));

    // If 3+ departments involved, mark all as High
    const uniqueDepts = new Set(validIssues.map(i => i.department));
    if (uniqueDepts.size >= 3) {
      validIssues.forEach(issue => { issue.priority = 'High'; });
    }

    // Check for urgency keywords
    const textLower = text.toLowerCase();
    const hasUrgency = URGENCY_KEYWORDS.some(kw => textLower.includes(kw));
    if (hasUrgency) {
      validIssues.forEach(issue => { issue.priority = 'High'; });
    }

    console.log('✅ OpenAI classification successful');
    return { issues: validIssues };
    
  } catch (error) {
    // Log specific error types
    if (error.status === 401) {
      console.error('❌ OpenAI API: Invalid API key');
    } else if (error.status === 429) {
      console.error('❌ OpenAI API: Rate limit exceeded');
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      console.error('❌ OpenAI API: Request timeout');
    } else if (error instanceof SyntaxError) {
      console.error('❌ OpenAI API: Failed to parse JSON response');
    } else {
      console.error('❌ OpenAI API error:', error.message);
    }
    
    // Always fall back to keyword-based classification
    console.log('ℹ️  Using fallback keyword-based classifier');
    return fallbackClassify(text);
  }
}

function fallbackClassify(text) {
  const textLower = text.toLowerCase();
  const issues = [];
  
  const keywordMap = {
    'Water Supply': ['water', 'pipeline', 'tap', 'borewell', 'drinking water', 'drain', 'storm drain', 'sewage'],
    'Roads & Infrastructure': ['road', 'pothole', 'bridge', 'highway', 'footpath', 'traffic', 'construction'],
    'Electricity': ['electricity', 'power', 'light', 'transformer', 'wire', 'street light', 'voltage'],
    'Sanitation': ['garbage', 'waste', 'dump', 'clean', 'toilet', 'sewage', 'trash', 'sanitation'],
    'Health': ['health', 'hospital', 'medical', 'disease', 'dengue', 'doctor', 'clinic', 'rash', 'sick'],
    'Education': ['school', 'education', 'teacher', 'student', 'mid-day meal', 'classroom'],
    'Revenue/Land Records': ['land', 'revenue', 'property', 'encroachment', 'survey', 'title', 'deed'],
    'General Administration': ['administration', 'office', 'government', 'order', 'coordinate', 'building', 'rescue']
  };

  const hasUrgency = URGENCY_KEYWORDS.some(kw => textLower.includes(kw));

  // Split the complaint into individual clauses by common separators
  const clauses = text
    .split(/[,;\n]|\band\b|\balso\b|\bmoreover\b|\badditionally\b|\bfurthermore\b/i)
    .map(s => s.trim())
    .filter(s => s.length > 3);

  const seenDepts = new Set();

  // If we have multiple clauses, classify each clause independently
  if (clauses.length > 1) {
    for (const clause of clauses) {
      const clauseLower = clause.toLowerCase();
      for (const [dept, keywords] of Object.entries(keywordMap)) {
        if (!seenDepts.has(dept) && keywords.some(kw => clauseLower.includes(kw))) {
          seenDepts.add(dept);
          const issueText = clause.charAt(0).toUpperCase() + clause.slice(1);
          issues.push({
            department: dept,
            issue_text: issueText,
            deadline: 'Not specified',
            priority: hasUrgency ? 'High' : 'Normal'
          });
          break; // each clause maps to exactly one department
        }
      }
    }
  }

  // If clause-splitting yielded nothing (single issue or no keyword matched any clause),
  // fall back to whole-text detection — matched departments get the full text
  if (issues.length === 0) {
    for (const [dept, keywords] of Object.entries(keywordMap)) {
      if (keywords.some(kw => textLower.includes(kw))) {
        issues.push({
          department: dept,
          issue_text: text.substring(0, 300),
          deadline: 'Not specified',
          priority: hasUrgency ? 'High' : 'Normal'
        });
      }
    }
  }

  if (issues.length === 0) {
    issues.push({
      department: 'General Administration',
      issue_text: text.substring(0, 300),
      deadline: 'Not specified',
      priority: 'Normal'
    });
  }

  // If 3+ departments, mark all High
  if (issues.length >= 3) {
    issues.forEach(i => { i.priority = 'High'; });
  }

  return { issues };
}

module.exports = { analyzeText };