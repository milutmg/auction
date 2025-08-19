# 🔌 Antique Bidderly Port Management Guide

This guide explains how to permanently configure and manage ports for the Antique Bidderly application.

## 📍 **Fixed Port Configuration**

### **Application Ports:**
- **Backend Server:** `3001` (Express.js + Socket.io)
- **Frontend Development:** `8080` (Vite dev server)

### **Why These Ports?**
- Port `3001` is commonly used for Node.js backends and avoids conflicts with common development servers
- Port `8080` is a standard HTTP alternate port, avoiding conflicts with system services
- Both ports are configured with `strictPort: true` to prevent automatic port switching

---

## 🛠️ **Automatic Setup**

### **Quick Setup (Recommended):**
```bash
cd /home/milan/fyp/antique-bidderly-1
./setup-port-reservation.sh
```

This interactive script will:
- ✅ Check current port usage
- 🧹 Clear conflicting processes
- 📝 Create helpful shell aliases
- 🖥️ Setup desktop shortcuts
- 🔒 Configure firewall rules (optional)

---

## 🚀 **Starting the Application**

### **Method 1: Enhanced Startup Script (Recommended)**
```bash
cd /home/milan/fyp/antique-bidderly-1
./start_servers.sh
```

### **Method 2: Using Shell Aliases (after setup)**
```bash
# Check port status
check-antique-ports

# Clear ports and start application
start-antique

# Just clear ports
kill-antique-ports
```

### **Method 3: Manual Port Management**
```bash
# Check port status
./manage-ports.sh status

# Clear ports
./manage-ports.sh clear

# Start application
./start_servers.sh
```

---

## 🔧 **Manual Port Management**

### **Check if ports are in use:**
```bash
# Check specific ports
lsof -i:3001  # Backend
lsof -i:8080  # Frontend

# Or use the management script
./manage-ports.sh status
```

### **Clear specific ports:**
```bash
# Kill processes on port 3001
lsof -ti:3001 | xargs kill -9

# Kill processes on port 8080
lsof -ti:8080 | xargs kill -9

# Or use the management script
./manage-ports.sh clear
```

### **Find what's using a port:**
```bash
lsof -i:PORT_NUMBER
netstat -tulpn | grep PORT_NUMBER
```

---

## ⚙️ **Configuration Files**

### **Frontend Configuration (`client/.env`):**
```env
# Fixed port configuration
VITE_API_URL=http://localhost:3001/api
VITE_BASE_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
VITE_PORT=8080
VITE_HOST=0.0.0.0
```

### **Backend Configuration (`server/.env`):**
```env
# Fixed port configuration  
PORT=3001
FRONTEND_URL=http://localhost:8080
ALLOWED_ORIGINS=http://localhost:8080,http://127.0.0.1:8080
```

### **Vite Configuration (`client/vite.config.ts`):**
```typescript
export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 8080,
    strictPort: true, // Fail if port is occupied
    // ... other config
  }
});
```

---

## 🚨 **Troubleshooting Port Conflicts**

### **Common Issues:**

1. **Port 3001 occupied by another Node.js app:**
   ```bash
   # Find and kill Node.js processes
   pkill -f node
   # Or more specifically
   pkill -f "node.*3001"
   ```

2. **Port 8080 occupied by another web server:**
   ```bash
   # Common culprits: Apache, Nginx, other dev servers
   sudo systemctl stop apache2  # If Apache is running
   sudo systemctl stop nginx    # If Nginx is running
   ```

3. **Permission denied errors:**
   ```bash
   # On some systems, you might need sudo for port management
   sudo ./manage-ports.sh clear
   ```

4. **Persistent port conflicts:**
   ```bash
   # Nuclear option - restart network services
   sudo systemctl restart networking
   
   # Or reboot the system
   sudo reboot
   ```

---

## 🔒 **Firewall Configuration**

### **UFW (Ubuntu Firewall):**
```bash
# Allow development ports
sudo ufw allow 3001/tcp comment "Antique Bidderly Backend"
sudo ufw allow 8080/tcp comment "Antique Bidderly Frontend"

# Check rules
sudo ufw status
```

### **iptables:**
```bash
# Allow inbound connections
sudo iptables -A INPUT -p tcp --dport 3001 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 8080 -j ACCEPT
```

---

## 📊 **Monitoring Port Usage**

### **Real-time monitoring:**
```bash
# Watch port usage
watch -n 2 'lsof -i:3001,8080'

# Monitor with netstat
watch -n 2 'netstat -tulpn | grep -E ":(3001|8080)"'
```

### **Logging:**
```bash
# Check application logs
journalctl -f -u antique-bidderly  # If using systemd service
tail -f server/logs/app.log        # Application logs
```

---

## 🖥️ **System Service (Optional)**

### **Install as systemd user service:**
```bash
# Copy service file
mkdir -p ~/.config/systemd/user
cp systemd/antique-bidderly.service ~/.config/systemd/user/

# Enable and start service
systemctl --user daemon-reload
systemctl --user enable antique-bidderly.service
systemctl --user start antique-bidderly.service

# Check status
systemctl --user status antique-bidderly.service
```

### **Service Management:**
```bash
# Start service
systemctl --user start antique-bidderly

# Stop service  
systemctl --user stop antique-bidderly

# Restart service
systemctl --user restart antique-bidderly

# View logs
journalctl --user -u antique-bidderly -f
```

---

## 💡 **Tips for Permanent Port Availability**

### **1. Reserve ports in /etc/services (Advanced):**
```bash
# Add to /etc/services (requires sudo)
echo "antique-backend    3001/tcp    # Antique Bidderly Backend" | sudo tee -a /etc/services
echo "antique-frontend   8080/tcp    # Antique Bidderly Frontend" | sudo tee -a /etc/services
```

### **2. Create startup aliases:**
Add to your `~/.bashrc` or `~/.zshrc`:
```bash
# Antique Bidderly aliases
alias antique-start='cd ~/fyp/antique-bidderly-1 && ./start_servers.sh'
alias antique-ports='cd ~/fyp/antique-bidderly-1 && ./manage-ports.sh'
alias antique-clear='cd ~/fyp/antique-bidderly-1 && ./manage-ports.sh clear'
```

### **3. Desktop shortcut:**
A desktop entry is created automatically by `setup-port-reservation.sh`.

---

## 🆘 **Emergency Port Recovery**

If you completely lose control of the ports:

```bash
# Nuclear option - kill all node and vite processes
pkill -f node
pkill -f vite
pkill -f npm

# Wait and restart network
sudo systemctl restart networking

# Reboot if necessary
sudo reboot
```

---

## ✅ **Verification**

After setup, verify everything is working:

```bash
# 1. Check ports are free
./manage-ports.sh status

# 2. Start application
./start_servers.sh

# 3. Test connectivity
curl http://localhost:3001/  # Should return API response
curl http://localhost:8080/  # Should return frontend

# 4. Test in browser
# Frontend: http://localhost:8080
# Backend API: http://localhost:3001
# Debug page: http://localhost:8080/debug
```

---

## 📞 **Support**

If you continue to experience port conflicts:

1. Check the troubleshooting section above
2. Run `./manage-ports.sh status` for detailed information
3. Check system logs: `journalctl -f`
4. Consider restarting your development environment

**Remember:** The configuration now uses `strictPort: true`, so the application will fail to start if ports are occupied, rather than switching to different ports automatically. This ensures consistent port usage.
