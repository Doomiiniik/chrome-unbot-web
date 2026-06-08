const express = require('express');
const app = express();
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});








const PORT = 3000;

app.use(express.json());

// simple healthcheck
app.get('/ping', (req, res) => {
  res.json({ ok: true, message: 'Chrome Unbot backend is running' });
});

app.post('/analyze', (req, res) => {
  const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  console.log("Client IP:", clientIp);

  const fp = req.body;
  fp.ip = clientIp;

  let score = 0;
  let reasons = [];
  let fixes = [];

  // 1. WebRTC
  if (fp.webrtc === 'disabled') {
    score += 20;
    reasons.push('WebRTC is disabled');
    fixes.push('Enable WebRTC (chrome://flags → WebRTC)');
  }

  // 2. Canvas
  if (fp.canvas === 'blocked') {
    score += 20;
    reasons.push('Canvas is blocked');
    fixes.push('Allow Canvas (disable fingerprint blockers)');
  }
  if (fp.canvas === 'noise') {
    score += 10;
    reasons.push('Canvas fingerprint noise detected');
    fixes.push('Disable Canvas spoofing in extensions');
  }

  // 3. AudioContext
  if (fp.audiocontext === 'blocked') {
    score += 10;
    reasons.push('AudioContext is blocked');
    fixes.push('Allow AudioContext (remove fingerprint blockers)');
  }

  // 4. Extensions count
  if (fp.extensions_count === 0) {
    score += 10;
    reasons.push('Zero extensions — looks like a fresh profile');
    fixes.push('Install 1–2 normal extensions (Adblock, Password Manager)');
  }

  // 5. Incognito-only
  if (fp.incognito_only === true) {
    score += 20;
    reasons.push('Incognito-only profile detected');
    fixes.push('Use a normal Chrome profile');
  }

  // 6. Hardware
  if (fp.hardware_concurrency && fp.hardware_concurrency <= 2) {
    score += 10;
    reasons.push('Low CPU core count');
    fixes.push('Use a normal machine / avoid cheap VPS');
  }

  if (fp.device_memory && fp.device_memory <= 2) {
    score += 10;
    reasons.push('Low device memory (RAM)');
    fixes.push('Use a device with 4GB+ RAM');
  }

  // 7. IP reputation
  if (clientIp.startsWith('127.') || clientIp.startsWith('::1')) {
    score += 20;
    reasons.push('IP looks like localhost / VPN / proxy');
    fixes.push('Use a residential IP (LTE / fiber)');
  }


 // 8. WebGL
if (fp.webgl.status === "blocked") {
  score += 20;
  reasons.push("WebGL is blocked");
  fixes.push("Enable WebGL (disable fingerprint blockers)");
}

if (fp.webgl.renderer && fp.webgl.renderer.includes("SwiftShader")) {
  score += 20;
  reasons.push("Software renderer detected (SwiftShader)");
  fixes.push("Use a real GPU (disable VM / sandbox)");
}

if (fp.webgl.vendor === "unknown") {
  score += 10;
  reasons.push("WebGL vendor unknown");
  fixes.push("Disable privacy extensions that spoof WebGL");
}

// 9. Navigator entropy
if (fp.navigator_entropy) {
  // webdriver
  if (fp.navigator_entropy.webdriver === true) {
    score += 40;
    reasons.push("navigator.webdriver is true (automation detected)");
    fixes.push("Use a real browser session, not automation (Selenium / Puppeteer / Playwright)");
  }

  // plugins + mimeTypes
  if (fp.navigator_entropy.plugins_count === 0 && fp.navigator_entropy.mimetypes_count === 0) {
    score += 20;
    reasons.push("No plugins or mimeTypes detected");
    fixes.push("Avoid hardened profiles that strip plugins/mimeTypes completely");
  }

  // maxTouchPoints
  if (fp.navigator_entropy.max_touch_points === 0 && fp.platform && fp.platform.toLowerCase().includes("android")) {
    score += 15;
    reasons.push("Zero touch points on a mobile-like platform");
    fixes.push("Use a real mobile device or proper mobile emulation");
  }
}








  if (score > 100) score = 100;

  res.json({
    score,
    reasons,
    fixes_preview: fixes.slice(0, 3),
    full_fixes_locked: true,
    ip: clientIp
  });
});

const https = require("https");
const fs = require("fs");

const options = {
  key: fs.readFileSync("localhost-key.pem"),
  cert: fs.readFileSync("localhost.pem")
};

https.createServer(options, app).listen(3000, () => {
  console.log("HTTPS backend running at https://localhost:3000");
});

