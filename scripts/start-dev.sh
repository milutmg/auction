#!/bin/bash

# Antique Bidderly Development Startup Script
# This script ensures all dependencies are installed and servers start properly

set -e  # Exit on any error

echo "🚀 Starting Antique Bidderly Development Environment"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
SERVER_DIR="$SCRIPT_DIR/server"
CLIENT_DIR="$SCRIPT_DIR/client"

print_status "Project directory: $SCRIPT_DIR"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is in use
port_in_use() {
    ss -tlnp | grep -q ":$1 "
}

# Function to kill processes on specific ports
kill_port() {
    local port=$1
    print_warning "Killing processes on port $port"
    fuser -k ${port}/tcp 2>/dev/null || true
    sleep 2
}

# Check prerequisites
print_status "Checking prerequisites..."

if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command_exists npm; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

if ! command_exists psql; then
    print_error "PostgreSQL client is not installed."
    exit 1
fi

print_success "All prerequisites are available"

# Check if PostgreSQL is running
print_status "Checking PostgreSQL status..."
if ! systemctl is-active --quiet postgresql; then
    print_warning "PostgreSQL is not running. Starting it..."
    sudo systemctl start postgresql
    sleep 3
fi

# Test database connection
print_status "Testing database connection..."
if ! PGPASSWORD=password psql -h localhost -U milan -d antique_auction -c "SELECT 1;" >/dev/null 2>&1; then
    print_error "Cannot connect to database. Please check your database configuration."
    print_error "Make sure the database 'antique_auction' exists and user 'milan' has access."
    exit 1
fi
print_success "Database connection successful"

# Clean up any existing processes - AGGRESSIVE CLEANUP
print_status "Cleaning up existing processes..."

# Kill ALL processes on our target ports
for port in 3001 8080 8081 8082 8083; do
    if port_in_use $port; then
        print_warning "Force killing ALL processes on port $port"
        fuser -k ${port}/tcp 2>/dev/null || true
        sleep 1
    fi
done

# Kill any lingering node/vite processes
pkill -f "node.*server.js" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
pkill -f "esbuild" 2>/dev/null || true
sleep 2

# VERIFY ports are actually free
if port_in_use 3001; then
    print_error "CRITICAL: Port 3001 still occupied after cleanup!"
    print_error "Run: sudo lsof -ti:3001 | xargs kill -9"
    exit 1
fi

if port_in_use 8080; then
    print_error "CRITICAL: Port 8080 still occupied after cleanup!"
    print_error "Run: sudo lsof -ti:8080 | xargs kill -9"
    exit 1
fi

print_success "Ports 3001 and 8080 are now FREE"

# Install server dependencies
print_status "Installing server dependencies..."
cd "$SERVER_DIR"
if [ ! -d "node_modules" ] || [ package.json -nt node_modules/.package-lock.json ] 2>/dev/null; then
    npm install
    print_success "Server dependencies installed"
else
    print_status "Server dependencies are up to date"
fi

# Install client dependencies
print_status "Installing client dependencies..."
cd "$CLIENT_DIR"
if [ ! -d "node_modules" ] || [ package.json -nt node_modules/.package-lock.json ] 2>/dev/null; then
    npm install
    print_success "Client dependencies installed"
else
    print_status "Client dependencies are up to date"
fi

# Create client .env file if it doesn't exist
if [ ! -f "$CLIENT_DIR/.env" ]; then
    print_status "Creating client .env file..."
    cat > "$CLIENT_DIR/.env" << EOF
VITE_API_URL=http://localhost:3001/api
EOF
    print_success "Client .env file created"
fi

# Start the backend server
print_status "Starting backend server..."
cd "$SERVER_DIR"
nohup npm run dev > ../logs/server.log 2>&1 &
SERVER_PID=$!
echo $SERVER_PID > ../logs/server.pid

# Wait for server to start
sleep 5
if ! port_in_use 3001; then
    print_error "Backend server failed to start. Check logs/server.log for details."
    exit 1
fi

# Test backend API
print_status "Testing backend API..."
if ! curl -s http://localhost:3001 >/dev/null; then
    print_error "Backend API is not responding"
    exit 1
fi
print_success "Backend server is running on port 3001"

# Start the frontend server
print_status "Starting frontend server..."
cd "$CLIENT_DIR"
nohup npm run dev > ../logs/client.log 2>&1 &
CLIENT_PID=$!
echo $CLIENT_PID > ../logs/client.pid

# Wait for client to start and find actual port
sleep 8
actual_port=8080
for port in 8080 8081 8082 8083; do
    if port_in_use $port; then
        actual_port=$port
        break
    fi
done

if ! port_in_use $actual_port; then
    print_error "Frontend server failed to start. Check logs/client.log for details."
    exit 1
fi
print_success "Frontend server is running on port $actual_port"

# Test the connection between frontend and backend
print_status "Testing frontend-backend connection..."
sleep 3
if curl -s http://localhost:8080 | grep -q "html"; then
    print_success "Frontend is serving content"
else
    print_warning "Frontend might not be fully ready yet"
fi

echo ""
echo "🎉 Development Environment Started Successfully!"
echo "=============================================="
echo ""
echo "📊 Server Status:"
echo "  • Backend API: http://localhost:3001"
echo "  • Frontend App: http://localhost:8080"
echo "  • Database: PostgreSQL (running)"
echo ""
echo "📋 Process IDs:"
echo "  • Server PID: $SERVER_PID"
echo "  • Client PID: $CLIENT_PID"
echo ""
echo "📝 Logs:"
echo "  • Server: logs/server.log"
echo "  • Client: logs/client.log"
echo ""
echo "🛑 To stop the development environment:"
echo "   ./stop-dev.sh"
echo ""
echo "🌐 Open http://localhost:8080 in your browser to access the application!"

# Keep the script running to monitor
print_status "Monitoring servers... (Press Ctrl+C to stop)"
trap 'echo ""; print_warning "Shutting down servers..."; kill $SERVER_PID $CLIENT_PID 2>/dev/null; exit' INT

# Monitor the servers
while true; do
    if ! kill -0 $SERVER_PID 2>/dev/null; then
        print_error "Backend server stopped unexpectedly!"
        break
    fi
    if ! kill -0 $CLIENT_PID 2>/dev/null; then
        print_error "Frontend server stopped unexpectedly!"
        break
    fi
    sleep 10
done
