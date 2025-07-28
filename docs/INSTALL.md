# Claude Server Installation Guide

## Introduction

This guide explains how to expose Claude as a local service on port 3000. This allows the Claude browser extension to communicate with your local Claude installation.

This setup works on:
- macOS
- Linux (Ubuntu, Debian, etc.)
- Windows (with WSL)

## Requirements

- Node.js (version 14 or higher)
- npm (comes with Node.js)
- Claude Code CLI installed (`npx @anthropic-ai/claude-code`)

## Installation Steps

### 1. Set up the Server Directory

Copy [`server/server.js`](../server/server.js) file to your preferred location, preferably in a dedicated directory. Navigate to this location and install the required dependencies:

```bash
npm init -y
npm install express cors
```

### 2. Start the Server

Run the server with:

```bash
node server.js
```

You should see:
```
✅ Claude local server running at http://localhost:3000
```

### 3. Test the Server

Open your browser and go to: `http://localhost:3000/health`

You should see:
```json
{"status":"ok","cache_size":0}
```

Your Claude server is now running and ready to accept requests from the browser extension!

To start it on another port, look at "3000" in server.js file, and replace it by your preferred port. The extension currently supports 3000, 3001, 3002, 5000, 5173, 8000, 8080, 8081, 8888, and 9000.


## Windows-Specific Configuration (WSL)

If you're using Windows with WSL (Windows Subsystem for Linux), you need an additional step to forward the port from Windows to WSL.

### Get your WSL IP address

1. In your WSL terminal, run:
   ```bash
   ip addr | grep inet | grep eth0
   ```

2. Note the IP address (usually starts with 172.x.x.x)

### Configure Port Forwarding

1. Open PowerShell **as Administrator**

2. Run this command, replacing `YOUR_WSL_IP` with your actual WSL IP:
   ```powershell
   netsh interface portproxy add v4tov4 listenport=3000 listenaddress=127.0.0.1 connectport=3000 connectaddress=YOUR_WSL_IP
   ```

3. Verify the configuration:
   ```powershell
   netsh interface portproxy show all
   ```

### Note for Windows Users

The WSL IP address can change when you restart. If the extension stops working after a reboot:

1. Check your new WSL IP with `ip addr | grep inet | grep eth0`
2. Remove the old rule:
   ```powershell
   netsh interface portproxy delete v4tov4 listenport=3000 listenaddress=127.0.0.1
   ```
3. Add the new rule with the updated IP address

## Troubleshooting

### Port already in use
If you get an error that port 3000 is already in use, either:
- Stop the other service using port 3000
- Or change the port in `server.js` and in your extension configuration

### Claude Code not found
Make sure you have Claude Code CLI installed:
```bash
npx @anthropic-ai/claude-code --version
```