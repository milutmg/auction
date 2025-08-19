#!/bin/bash
# Development Server Shutdown Script

echo "Shutting down development servers..."

# Kill processes on development ports
echo "Killing processes on ports 3001, 8080, 8081, 8082, 8083..."
sudo lsof -ti:3001 | xargs -r sudo kill -9
sudo lsof -ti:8080 | xargs -r sudo kill -9 
sudo lsof -ti:8081 | xargs -r sudo kill -9
sudo lsof -ti:8082 | xargs -r sudo kill -9
sudo lsof -ti:8083 | xargs -r sudo kill -9

# Kill any node processes that might be hanging
echo "Killing any remaining node processes..."
pkill -f "node.*server.js" 2>/dev/null || true
pkill -f "vite.*dev" 2>/dev/null || true

echo "Development servers shut down complete!"
