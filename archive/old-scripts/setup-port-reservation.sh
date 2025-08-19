#!/bin/bash

# Antique Bidderly Port Reservation Setup
# This script helps ensure ports 3001 and 8080 are available for the application

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔧 Antique Bidderly Port Reservation Setup${NC}"
echo "=============================================="

# Function to check if running as root
check_root() {
    if [ "$EUID" -eq 0 ]; then
        echo -e "${RED}❌ Please do not run this script as root${NC}"
        exit 1
    fi
}

# Function to check if a port is in use and by what process
check_port_usage() {
    local port=$1
    local process_info=$(lsof -ti:$port 2>/dev/null)
    
    if [ -n "$process_info" ]; then
        echo -e "${YELLOW}⚠️  Port $port is currently in use:${NC}"
        lsof -i:$port
        return 0  # Port is in use
    else
        echo -e "${GREEN}✅ Port $port is available${NC}"
        return 1  # Port is free
    fi
}

# Function to kill processes on a port with confirmation
kill_port_processes() {
    local port=$1
    
    if check_port_usage $port; then
        read -p "Do you want to kill the processes using port $port? (y/N): " -r
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}Killing processes on port $port...${NC}"
            lsof -ti:$port | xargs kill -9 2>/dev/null || true
            sleep 2
            
            if check_port_usage $port; then
                echo -e "${RED}❌ Failed to free port $port${NC}"
                return 1
            else
                echo -e "${GREEN}✅ Port $port freed successfully${NC}"
                return 0
            fi
        else
            echo -e "${YELLOW}⚠️  Skipping port $port cleanup${NC}"
            return 1
        fi
    fi
}

# Function to create port reservation aliases
create_port_aliases() {
    local shell_config=""
    
    # Detect shell and config file
    if [ -n "$BASH_VERSION" ]; then
        shell_config="$HOME/.bashrc"
    elif [ -n "$ZSH_VERSION" ]; then
        shell_config="$HOME/.zshrc"
    else
        shell_config="$HOME/.bashrc"  # Default fallback
    fi
    
    echo -e "${BLUE}📝 Creating port management aliases in $shell_config${NC}"
    
    # Create aliases for easy port management
    cat >> "$shell_config" << 'EOF'

# ===================================
# Antique Bidderly Port Management
# ===================================

# Check if ports are available
alias check-antique-ports='echo "Checking Antique Bidderly ports..." && echo "Port 3001 (Backend):" && lsof -i:3001 || echo "  ✅ Available" && echo "Port 8080 (Frontend):" && lsof -i:8080 || echo "  ✅ Available"'

# Kill processes on Antique Bidderly ports
alias kill-antique-ports='echo "Killing processes on Antique Bidderly ports..." && lsof -ti:3001 | xargs kill -9 2>/dev/null || true && lsof -ti:8080 | xargs kill -9 2>/dev/null || true && echo "✅ Ports cleared"'

# Quick start Antique Bidderly (after clearing ports)
alias start-antique='cd ~/fyp/antique-bidderly-1 && kill-antique-ports && sleep 2 && ./start_servers.sh'

EOF
    
    echo -e "${GREEN}✅ Aliases created! Reload your shell or run: source $shell_config${NC}"
}

# Function to create a desktop entry for easy access
create_desktop_entry() {
    local desktop_file="$HOME/.local/share/applications/antique-bidderly.desktop"
    
    echo -e "${BLUE}📝 Creating desktop entry for easy access${NC}"
    
    mkdir -p "$HOME/.local/share/applications"
    
    cat > "$desktop_file" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Antique Bidderly
Comment=Start Antique Bidderly auction application
Exec=gnome-terminal --working-directory=/home/milan/fyp/antique-bidderly-1 -e ./start_servers.sh
Icon=applications-games
Terminal=true
Categories=Development;
Keywords=auction;antique;web;development;
EOF
    
    chmod +x "$desktop_file"
    echo -e "${GREEN}✅ Desktop entry created at $desktop_file${NC}"
}

# Function to setup firewall rules (optional)
setup_firewall_rules() {
    echo -e "${BLUE}🔒 Setting up firewall rules for development ports${NC}"
    
    # Check if ufw is installed and active
    if command -v ufw &> /dev/null; then
        echo -e "${YELLOW}UFW detected. Adding rules for development ports...${NC}"
        sudo ufw allow 3001/tcp comment "Antique Bidderly Backend"
        sudo ufw allow 8080/tcp comment "Antique Bidderly Frontend"
        echo -e "${GREEN}✅ Firewall rules added${NC}"
    else
        echo -e "${YELLOW}⚠️  UFW not found. Skipping firewall configuration.${NC}"
    fi
}

# Main setup function
main() {
    check_root
    
    echo -e "${BLUE}🔍 Checking current port usage...${NC}"
    echo ""
    
    # Check current port usage
    echo -e "${YELLOW}Backend Port (3001):${NC}"
    check_port_usage 3001
    echo ""
    
    echo -e "${YELLOW}Frontend Port (8080):${NC}"
    check_port_usage 8080
    echo ""
    
    # Offer to kill processes if ports are in use
    echo -e "${BLUE}🧹 Port Cleanup Options:${NC}"
    
    read -p "Do you want to clear ports 3001 and 8080 now? (y/N): " -r
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill_port_processes 3001
        kill_port_processes 8080
    fi
    
    echo ""
    
    # Create helpful aliases
    read -p "Do you want to create helpful shell aliases for port management? (Y/n): " -r
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        create_port_aliases
    fi
    
    echo ""
    
    # Create desktop entry
    read -p "Do you want to create a desktop entry for easy application startup? (Y/n): " -r
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        create_desktop_entry
    fi
    
    echo ""
    
    # Setup firewall rules
    read -p "Do you want to setup firewall rules for the development ports? (y/N): " -r
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_firewall_rules
    fi
    
    echo ""
    echo -e "${GREEN}🎉 Port reservation setup complete!${NC}"
    echo "=============================================="
    echo -e "${YELLOW}📋 Summary of available commands:${NC}"
    echo -e "  • ${GREEN}check-antique-ports${NC} - Check port availability"
    echo -e "  • ${GREEN}kill-antique-ports${NC}  - Clear both ports"
    echo -e "  • ${GREEN}start-antique${NC}       - Clear ports and start application"
    echo ""
    echo -e "${YELLOW}📍 To apply aliases immediately:${NC}"
    echo -e "  source ~/.bashrc   # or ~/.zshrc for zsh users"
    echo ""
    echo -e "${YELLOW}🚀 To start your application:${NC}"
    echo -e "  cd /home/milan/fyp/antique-bidderly-1"
    echo -e "  ./start_servers.sh"
}

# Run main function
main "$@"
