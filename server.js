const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

// prosty healthcheck
app.get('/ping', (req, res) => {
  res.json({ ok: true, message: 'Chrome Unbot backend działa' });
});


function analyzeFingerprint(fp) {
  return {
    score: 50,
    reasons: ["placeholder"],
    fixes_preview: ["placeholder"],
    full_fixes_locked: false
  };
}

app.post('/analyze', (req, res) => {
  const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  console.log("IP klienta:", clientIp);

  const fp = req.body;

  let score = 0;
  let reasons = [];
  let fixes = [];

  // 1. WebRTC
  if (fp.webrtc === 'disabled') {
    score += 20;
    reasons.push('WebRTC disabled');
    fixes.push('Włącz WebRTC (chrome://flags → WebRTC)');
  }

  // 2. Canvas
  if (fp.canvas === 'blocked') {
    score += 20;
    reasons.push('Canvas blocked');
    fixes.push('Zezwól na Canvas (wyłącz blokery fingerprintu)');
  }
  if (fp.canvas === 'noise') {
    score += 10;
    reasons.push('Canvas fingerprint noise detected');
    fixes.push('Wyłącz Canvas spoofing w rozszerzeniach');
  }

  // 3. AudioContext
  if (fp.audiocontext === 'blocked') {
    score += 10;
    reasons.push('AudioContext blocked');
    fixes.push('Zezwól na AudioContext (usuń blokery fingerprintu)');
  }

  // 4. Extensions count
  if (fp.extensions_count === 0) {
    score += 10;
    reasons.push('Zero extensions — wygląda jak świeży profil');
    fixes.push('Dodaj 1–2 normalne rozszerzenia (Adblock, Password Manager)');
  }

  // 5. Incognito-only
  if (fp.incognito_only === true) {
    score += 20;
    reasons.push('Incognito-only profile');
    fixes.push('Użyj normalnego profilu Chrome');
  }

  // 6. Hardware
  if (fp.hardware_concurrency && fp.hardware_concurrency <= 2) {
    score += 10;
    reasons.push('Niska liczba rdzeni CPU');
    fixes.push('Użyj normalnej maszyny / nie używaj taniego VPS');
  }

  if (fp.device_memory && fp.device_memory <= 2) {
    score += 10;
    reasons.push('Niska ilość RAM');
    fixes.push('Użyj urządzenia z 4GB+ RAM');
  }

  // 7. IP reputation
  if (clientIp.startsWith('127.') || clientIp.startsWith('::1')) {
    score += 20;
    reasons.push('IP wygląda jak lokalne / VPN / proxy');
    fixes.push('Użyj residential IP (LTE / światłowód)');
  }

  if (score > 100) score = 100;

  // JEDYNA odpowiedź
  res.json({
    score,
    reasons,
    fixes_preview: fixes.slice(0, 3),
    full_fixes_locked: true,
    ip: clientIp
  });
});






app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});


