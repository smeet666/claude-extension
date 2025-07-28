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