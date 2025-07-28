const express = require("express");
const { exec } = require("child_process");
const cors = require('cors');
const app = express();
const port = 3000;

// Configure CORS to block HTTP origins
const corsOptions = {
  origin: function (origin, callback) {
    // Handle different origin cases
    if (origin === undefined) {
      // No origin header = likely an extension or direct tool
      callback(null, true);
    } else if (origin === 'null' || origin === null) {
      // Origin "null" = file:// protocol, block it
      console.log('🚫 Blocked request from file:// protocol');
      callback(null, false);
    } else if (origin.startsWith('moz-extension://') || origin.startsWith('chrome-extension://')) {
      // Explicitly allow browser extensions
      callback(null, true);
    } else if (origin.startsWith('http://') || origin.startsWith('https://')) {
      // Block all HTTP/HTTPS origins
      console.log('🚫 Blocked request from:', origin);
      callback(null, false);
    } else {
      // Block any other unknown origin
      console.log('🚫 Blocked request from unknown origin:', origin);
      callback(null, false);
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "2mb" }));
// Simple cache to avoid re-requesting the same things
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Clear cache every 10 minutes
setInterval(() => {
  console.log(`🧹 Clearing cache (${cache.size} entries)`);
  cache.clear();
}, 10 * 60 * 1000); // 10 minutes

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