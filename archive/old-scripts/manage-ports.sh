#!/bin/bash

# Quick Port Management for Antique Bidderly
# Usage: ./manage-ports.sh [check|clear|status]

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BACKEND_PORT=3001
FRONTEND_PORT=8080

# Function to check port status
check_port() {
    local port=$1
    local name=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${RED}❌ $name (Port $port): IN USE${NC}"
        lsof -i:$port 2>/dev/null | head -2
        return 1
    else
        echo -e "${GREEN}✅ $name (Port $port): AVAILABLE${NC}"
        return 0
    fi
}

# Function to kill processes on a port
kill_port() {
    local port=$1
    local name=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}🔄 Killing processes on $name (Port $port)...${NC}"
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        pkill -f ":$port" 2>/dev/null || true
        sleep 2
        
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo -e "${RED}❌ Failed to clear $name (Port $port)${NC}"
            return 1
        else
            echo -e "${GREEN}✅ $name (Port $port) cleared successfully${NC}"
            return 0
        fi
    else
        echo -e "${GREEN}✅ $name (Port $port) was already free${NC}"
        return 0
    fi
}

# Function to show detailed status
show_status() {
    echo -e "${BLUE}📊 Antique Bidderly Port Status${NC}"
    echo "================================"
    check_port $BACKEND_PORT "Backend Server"
    echo ""
    check_port $FRONTEND_PORT "Frontend Server"
    echo ""
    
    # Show any other processes that might interfere
    echo -e "${BLUE}🔍 Other processes on common ports:${NC}"
    for port in 3000 3001 8080 8081 5173; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo -e "${YELLOW}Port $port:${NC}"
            lsof -i:$port 2>/dev/null | head -2
        fi
    done
}

# Function to clear both ports
clear_ports() {
    echo -e "${YELLOW}🧹 Clearing Antique Bidderly ports...${NC}"
    echo ""
    
    kill_port $BACKEND_PORT "Backend Server"
    kill_port $FRONTEND_PORT "Frontend Server"
    
    echo ""
    echo -e "${GREEN}🎉 Port clearing complete!${NC}"
    show_status
}

# Main script logic
case "${1:-status}" in
    "check"|"status")
        show_status
        ;;
    "clear"|"kill")
        clear_ports
        ;;
    "help"|"--help"|"-h")
        echo -e "${GREEN}Antique Bidderly Port Management${NC}"
        echo "================================"
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo -e "  ${YELLOW}status${NC}  - Show current port status (default)"
        echo -e "  ${YELLOW}clear${NC}   - Clear both application ports"
        echo -e "  ${YELLOW}help${NC}    - Show this help message"
        echo ""
        echo "Application Ports:"
        echo -e "  ${BLUE}Backend:${NC}  Port $BACKEND_PORT"
        echo -e "  ${BLUE}Frontend:${NC} Port $FRONTEND_PORT"
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo -e "Run ${YELLOW}$0 help${NC} for usage information"
        exit 1
        ;;
esac
