# Installation Guide for Windows WSL

This guide will help you set up the Claude extension server on Windows using WSL (Windows Subsystem for Linux).

## Prerequisites

- Windows 10/11 with WSL2 installed
- Ubuntu installed in WSL
- Node.js installed in your WSL Ubuntu
- Administrator access on Windows

## Setup Instructions

### 1. Configure Port Forwarding (One-time setup)

Since WSL2 runs in a virtual machine, we need to forward the port from Windows to WSL.

#### Get your WSL IP address

1. Open your WSL Ubuntu terminal
2. Run the following command to find your WSL IP address:
   ```bash
   ip addr | grep inet | grep eth0
   ```
3. Look for the IP address (usually starts with 172.x.x.x). Example output:
   ```
   inet 172.21.240.123/20 brd 172.21.255.255 scope global eth0
   ```
   In this example, your IP is `172.21.240.123`

#### Set up port forwarding

1. Open PowerShell **as Administrator** (Right-click → Run as administrator)
2. Run the following command, replacing `YOUR_WSL_IP` with the IP address from above:
   ```powershell
   netsh interface portproxy add v4tov4 listenport=3000 listenaddress=127.0.0.1 connectport=3000 connectaddress=YOUR_WSL_IP
   ```
   Example:
   ```powershell
   netsh interface portproxy add v4tov4 listenport=3000 listenaddress=127.0.0.1 connectport=3000 connectaddress=172.21.240.123
   ```

3. Verify the rule was created successfully:
   ```powershell
   netsh interface portproxy show all
   ```
   You should see your port forwarding rule listed.

### 2. Set up the Claude Server

1. Open your WSL Ubuntu terminal
2. Create a new directory for the server:
   ```bash
   mkdir ~/claude-server
   cd ~/claude-server
   ```

3. Create the `server.js` file:
   ```bash
   nano server.js
   ```

4. Copy the server code into the file (press `Ctrl+X`, then `Y` to save)

5. Create `package.json`:
   ```bash
   npm init -y
   ```

6. Install dependencies:
   ```bash
   npm install express cors
   ```

### 3. Run the Server

1. In your WSL Ubuntu terminal, start the server:
   ```bash
   node server.js
   ```
   
2. You should see:
   ```
   ✅ Claude local server running at http://localhost:3000
   ```

3. Test the server by opening a browser and going to: `http://localhost:3000/health`

## Troubleshooting

### Port forwarding not working

If the extension can't connect to the server:

1. **Check if WSL IP has changed** (it can change on restart):
   ```bash
   # In WSL
   ip addr | grep inet | grep eth0
   ```

2. **Remove old rule and add new one**:
   ```powershell
   # In PowerShell as admin
   netsh interface portproxy delete v4tov4 listenport=3000 listenaddress=127.0.0.1
   netsh interface portproxy add v4tov4 listenport=3000 listenaddress=127.0.0.1 connectport=3000 connectaddress=NEW_IP
   ```

### Windows Firewall blocking connection

1. Open Windows Defender Firewall
2. Click "Allow an app or feature..."
3. Add Node.js to the allowed list

### Server crashes

Check the logs and ensure you have `npx @anthropic-ai/claude-code` properly installed:
```bash
npx @anthropic-ai/claude-code --version
```

## Auto-start Server (Optional)

To start the server automatically when WSL starts:

1. Add to your `~/.bashrc`:
   ```bash
   echo "cd ~/claude-server && node server.js &" >> ~/.bashrc
   ```

## Making Port Forwarding Persistent

The port forwarding rule persists across reboots, but the WSL IP might change. To handle this:

1. Create a PowerShell script `update-wsl-port.ps1`:
   ```powershell
   $wslIp = (wsl hostname -I).Trim().Split()[0]
   netsh interface portproxy delete v4tov4 listenport=3000 listenaddress=127.0.0.1
   netsh interface portproxy add v4tov4 listenport=3000 listenaddress=127.0.0.1 connectport=3000 connectaddress=$wslIp
   Write-Host "Port forwarding updated to WSL IP: $wslIp"
   ```

2. Run this script as administrator whenever you restart WSL.

## Next Steps

- Test the extension on various websites
- Consider setting up the server as a systemd service for better management

## Support

If you encounter issues:
1. Check the browser console (F12) for extension errors
2. Check the server logs in the WSL terminal
3. Verify the port forwarding with `netsh interface portproxy show all`