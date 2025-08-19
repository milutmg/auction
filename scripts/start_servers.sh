#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Antique Bidderly Application Servers${NC}"
echo "================================================"

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill processes on a port with detailed info
kill_port() {
    local port=$1
    echo -e "${YELLOW}Checking port $port...${NC}"
    
    if check_port $port; then
        echo -e "${RED}Port $port is in use. Showing processes:${NC}"
        lsof -i:$port 2>/dev/null || echo "No detailed process info available"
        
        echo -e "${YELLOW}Killing processes on port $port...${NC}"
        # More aggressive port clearing
        pkill -f ":$port" 2>/dev/null || true
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        
        # Wait longer for processes to fully terminate
        sleep 3
        
        # Double-check and force kill if needed
        if check_port $port; then
            echo -e "${YELLOW}Attempting force kill...${NC}"
            sudo lsof -ti:$port | xargs sudo kill -9 2>/dev/null || true
            sleep 2
            
            if check_port $port; then
                echo -e "${RED}❌ Failed to free port $port. You may need to restart your system.${NC}"
                return 1
            else
                echo -e "${GREEN}✅ Port $port freed successfully (with force)${NC}"
            fi
        else
            echo -e "${GREEN}✅ Port $port freed successfully${NC}"
        fi
    else
        echo -e "${GREEN}✅ Port $port is already free${NC}"
    fi
    return 0
}

# Clean up any existing processes
echo -e "${YELLOW}🧹 Cleaning up existing processes...${NC}"
kill_port 3001  # Backend server
kill_port 8080  # Frontend Vite server

echo ""

# Start backend server
echo -e "${GREEN}🔧 Starting Backend Server (Port 3001)...${NC}"
cd server
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    npm install
fi

# Start backend server in background
npm start &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Check if backend is running
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${GREEN}✅ Backend server started successfully (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}❌ Failed to start backend server${NC}"
    exit 1
fi

echo ""

# Start frontend server
echo -e "${GREEN}🎨 Starting Frontend Development Server (Port 8080)...${NC}"
cd ../client
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install
fi

# Start frontend server in background
npm run dev &
FRONTEND_PID=$!

# Wait a moment for frontend to start
sleep 5

# Check if frontend is running
if kill -0 $FRONTEND_PID 2>/dev/null; then
    echo -e "${GREEN}✅ Frontend server started successfully (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${RED}❌ Failed to start frontend server${NC}"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Both servers are now running!${NC}"
echo "================================================"
echo -e "📍 Frontend: ${GREEN}http://localhost:8080${NC}"
echo -e "📍 Backend:  ${GREEN}http://localhost:3001${NC}"
echo -e "🔧 Debug Page: ${GREEN}http://localhost:8080/debug${NC}"
echo ""
echo -e "${YELLOW}📝 Testing Notes:${NC}"
echo "• The notification system has been deeply enhanced with sound controls"
echo "• User profile dropdown includes logout functionality"
echo "• Visit /debug to test both notification and user profile features"
echo "• Bell icon bounces and shows badge count for new notifications"
echo "• Volume icon in notifications allows sound toggle"
echo ""
echo -e "${YELLOW}To stop the servers:${NC}"
echo "Press Ctrl+C or run: kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo -e "${GREEN}Backend PID: $BACKEND_PID${NC}"
echo -e "${GREEN}Frontend PID: $FRONTEND_PID${NC}"

# Keep the script running and monitor the processes
wait
