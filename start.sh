#!/bin/bash
echo "🏛️ Starting Citizen Grievance & Government Order Auto-Routing System"
echo "======================================================================"
echo ""

# Check if .env exists for backend
if [ ! -f "./backend/.env" ]; then
  echo "⚠️  No backend/.env file found. Creating one..."
  echo "PORT=3001" > ./backend/.env
  echo "OPENAI_API_KEY=your_openai_api_key_here" >> ./backend/.env
  echo "   Please edit backend/.env and add your OpenAI API key."
  echo "   (The system will use fallback keyword-based classification without it)"
  echo ""
fi

# Start backend
echo "🚀 Starting Backend (port 3001)..."
cd backend
node server.js &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 2

# Start frontend
echo "🚀 Starting Frontend (port 3000)..."
cd frontend
PORT=3000 REACT_APP_API_URL=http://localhost:3001 npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Services starting..."
echo "   Backend:  http://localhost:3001"
echo "   Frontend: http://localhost:3000"
echo ""
echo "   Press Ctrl+C to stop both services"
echo ""

# Wait for Ctrl+C
trap "echo ''; echo '🛑 Stopping services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT
wait