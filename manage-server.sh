#!/bin/bash

# Server Management Script for Antique Bidderly
echo "🏺 Antique Bidderly Server Management"
echo "=================================="

# Function to check if server is running
check_server() {
    if pgrep -f "node server.js" > /dev/null; then
        echo "✅ Server is running"
        echo "PID: $(pgrep -f 'node server.js')"
        echo "Port: $(lsof -ti :3002)"
        return 0
    else
        echo "❌ Server is not running"
        return 1
    fi
}

# Function to start server
start_server() {
    if check_server > /dev/null; then
        echo "⚠️  Server is already running!"
        check_server
    else
        echo "🚀 Starting server..."
        cd /home/milan/fyp/antique-bidderly-1/server
        node server.js &
        sleep 2
        if check_server > /dev/null; then
            echo "✅ Server started successfully!"
        else
            echo "❌ Failed to start server"
        fi
    fi
}

# Function to stop server
stop_server() {
    if check_server > /dev/null; then
        echo "🛑 Stopping server..."
        pkill -f "node server.js"
        sleep 1
        if ! check_server > /dev/null; then
            echo "✅ Server stopped successfully!"
        else
            echo "❌ Failed to stop server"
        fi
    else
        echo "⚠️  Server is not running"
    fi
}

# Function to restart server
restart_server() {
    echo "🔄 Restarting server..."
    stop_server
    sleep 1
    start_server
}

# Function to show server status
status_server() {
    echo "📊 Server Status:"
    check_server
    
    echo ""
    echo "🌐 Endpoints:"
    echo "- API: http://localhost:3002"
    echo "- Frontend: http://localhost:8080"
    
    echo ""
    echo "🔍 Quick Health Check:"
    if curl -s http://localhost:3002 > /dev/null; then
        echo "✅ API is responding"
    else
        echo "❌ API is not responding"
    fi
}

# Main menu
case "$1" in
    start)
        start_server
        ;;
    stop)
        stop_server
        ;;
    restart)
        restart_server
        ;;
    status)
        status_server
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the server"
        echo "  stop    - Stop the server"
        echo "  restart - Restart the server"
        echo "  status  - Show server status"
        ;;
esac
