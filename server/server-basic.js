const express = require("express");
const { exec } = require("child_process");
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.post("/claude", (req, res) => {
  console.log('🟡 Request received:', req.body);
  const inputText = req.body.input;

  if (!inputText) {
    return res.status(400).json({ error: "Text is missing" });
  }

  const command = `echo ${JSON.stringify(inputText)} | npx @anthropic-ai/claude-code`;

  console.time("⏱️ Claude Response time");

  exec(command, { shell: "/bin/bash" }, (err, stdout, stderr) => {
    console.timeEnd("⏱️ Claude Response time");

    if (err) {
      console.error("❌ Error:", stderr);
      return res.status(500).json({ error: stderr });
    }

    console.log('✅ Response ready:', stdout.length, 'characters');
    res.json({ response: stdout });
  });
});

app.listen(port, () => {
  console.log(`✅ Claude local server running at http://localhost:${port}`);
});