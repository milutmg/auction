#!/bin/bash

# Antique Bidderly Development Stop Script
# This script stops all development servers gracefully

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🛑 Stopping Antique Bidderly Development Environment"
echo "===================================================="

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
LOGS_DIR="$SCRIPT_DIR/logs"

# Function to kill processes on specific ports
kill_port() {
    local port=$1
    print_status "Stopping processes on port $port..."
    if ss -tlnp | grep -q ":$port "; then
        fuser -k ${port}/tcp 2>/dev/null || true
        sleep 2
        print_success "Processes on port $port stopped"
    else
        print_status "No processes running on port $port"
    fi
}

# Function to kill process by PID file
kill_by_pid_file() {
    local pid_file=$1
    local service_name=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            print_status "Stopping $service_name (PID: $pid)..."
            kill "$pid" 2>/dev/null
            sleep 3
            if kill -0 "$pid" 2>/dev/null; then
                print_warning "Force killing $service_name..."
                kill -9 "$pid" 2>/dev/null
            fi
            print_success "$service_name stopped"
        else
            print_status "$service_name was not running"
        fi
        rm -f "$pid_file"
    else
        print_status "No PID file found for $service_name"
    fi
}

# Create logs directory if it doesn't exist
mkdir -p "$LOGS_DIR"

# Stop servers using PID files
kill_by_pid_file "$LOGS_DIR/server.pid" "Backend Server"
kill_by_pid_file "$LOGS_DIR/client.pid" "Frontend Server"

# Kill any remaining processes on our ports
kill_port 3001
kill_port 8080

# Kill any node processes that might be related to our project
print_status "Cleaning up any remaining node processes..."
pkill -f "node.*server.js" 2>/dev/null || true
pkill -f "vite.*dev" 2>/dev/null || true

print_success "All development servers stopped"
echo ""
echo "💡 To start the development environment again:"
echo "   ./start-dev.sh"
echo ""
