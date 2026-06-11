// server.js — najprostszy możliwy backend
const express = require("express");
const path = require("path");

const app = express();

// CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// JSON parser
app.use(express.json());

// Serwujemy folder web/
app.use(express.static(path.join(__dirname, "web")));

// ----------------------
// ANALYZE FUNCTION
// ----------------------
function analyzeFingerprint(fp = {}, clientIp = null) {
  let score = 0;
  let reasons = [];
  let fixes = [];

  if (fp.webrtc === "disabled") {
    score += 20;
    reasons.push("WebRTC is disabled");
    fixes.push("Enable WebRTC");
  }

  if (fp.canvas === "blocked") {
    score += 20;
    reasons.push("Canvas is blocked");
    fixes.push("Allow Canvas");
  }

  if (fp.audiocontext === "blocked") {
    score += 10;
    reasons.push("AudioContext blocked");
    fixes.push("Allow AudioContext");
  }

  if (fp.hardware_concurrency && fp.hardware_concurrency <= 2) {
    score += 10;
    reasons.push("Low CPU core count");
    fixes.push("Use a normal machine");
  }

  if (fp.device_memory && fp.device_memory <= 2) {
    score += 10;
    reasons.push("Low device memory");
    fixes.push("Use device with 4GB+ RAM");
  }

  if (fp.webgl?.status === "blocked") {
    score += 20;
    reasons.push("WebGL blocked");
    fixes.push("Enable WebGL");
  }

  if (fp.navigator_entropy?.plugins_count === 0 &&
      fp.navigator_entropy?.mimetypes_count === 0) {
    score += 20;
    reasons.push("No plugins or mimeTypes");
    fixes.push("Avoid hardened profiles");
  }

  if (score > 100) score = 100;

  return {
    score,
    reasons,
    fixes_preview: fixes.slice(0, 3),
    full_fixes_locked: true,
    ip: clientIp || null
  };
}

// ----------------------
// ENDPOINTS
// ----------------------
app.post("/analyze-web", (req, res) => {
  console.log("POST /analyze-web");
  const fp = req.body || {};
  const result = analyzeFingerprint(fp, null);
  res.json(result);
});

// ----------------------
// START SERVER
// ----------------------
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
