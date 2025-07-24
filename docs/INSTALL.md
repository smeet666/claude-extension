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

### 1. Create the Server File

Create a new file called `server.js` with the following content:

```javascript
const express = require("express");
const { exec } = require("child_process");
const cors = require('cors');
const app = express();
const port = 3000;
app.use(cors());
app.use(express.json({ limit: "2mb" }));
// Simple cache to avoid re-requesting the same things
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
app.post("/claude", async (req, res) => {
  console.log('🟡 Request received');
  const inputText = req.body.input;
 
  if (!inputText) {
    return res.status(400).json({ error: "Missing text" });
  }
  // Check cache
  const cached = cache.get(inputText);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('📦 Response from cache');
    return res.json({ response: cached.response });
  }
  // Properly escape text for shell
  const escapedInput = inputText.replace(/'/g, "'\\''");
  const command = `echo '${escapedInput}' | npx @anthropic-ai/claude-code`;
 
  console.time("⏱️ Claude response time");
 
  exec(command, {
    shell: "/bin/bash",
    maxBuffer: 10 * 1024 * 1024 // 10MB buffer
  }, (err, stdout, stderr) => {
    console.timeEnd("⏱️ Claude response time");
   
    if (err) {
      console.error("❌ Error:", stderr);
      return res.status(500).json({ error: stderr || err.message });
    }
   
    // Save to cache
    cache.set(inputText, {
      response: stdout,
      timestamp: Date.now()
    });
   
    console.log('✅ Response ready:', stdout.length, 'characters');
    res.json({ response: stdout });
  });
});
// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", cache_size: cache.size });
});
app.listen(port, () => {
  console.log(`✅ Claude local server running at http://localhost:${port}`);
});
```

### 2. Install Dependencies

In the same directory as your `server.js` file, run:

```bash
npm init -y
npm install express cors
```

### 3. Start the Server

Run the server with:

```bash
node server.js
```

You should see:
```
✅ Claude local server running at http://localhost:3000
```

### 4. Test the Server

Open your browser and go to: `http://localhost:3000/health`

You should see:
```json
{"status":"ok","cache_size":0}
```

Your Claude server is now running and ready to accept requests from the browser extension!

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