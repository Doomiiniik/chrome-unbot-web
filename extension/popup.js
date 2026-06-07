console.log("POPUP JS LOADED");

async function testWebRTC() {
  try {
    const pc = new RTCPeerConnection({ iceServers: [] });
    pc.createDataChannel("test");
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    return await new Promise(resolve => {
      pc.onicecandidate = event => {
        if (event.candidate) {
          resolve("enabled");
          pc.close();
        }
      };
      setTimeout(() => { resolve("disabled"); pc.close(); }, 1000);
    });
  } catch (e) {
    return "disabled";
  }
}

function testCanvas() {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return "blocked";
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.fillText("ChromeUnbotTest", 2, 2);
    const data = canvas.toDataURL();
    if (!data || data.length < 50) return "blocked";
    if (data.length < 300) return "noise";
    return "ok";
  } catch (e) {
    return "blocked";
  }
}

async function testAudioContext() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const analyser = ctx.createAnalyser();
    oscillator.connect(analyser);
    oscillator.start(0);
    const buffer = new Float32Array(analyser.frequencyBinCount);
    analyser.getFloatFrequencyData(buffer);
    oscillator.stop();
    if (!buffer || buffer.length === 0) return "blocked";
    return "ok";
  } catch (e) {
    return "blocked";
  }
}

async function detectExtensions() {
  const knownExtensions = [
    "cjpalhdlnbpafiamejdnhcphjbkeiagm", // uBlock
    "gighmmpiobklfepjocnamgkkbiglidom", // Adblock
    "aapbdbdomjkkjkaonfhkkikfgjllcleb"  // Google Translate (przykład)
  ];
  let count = 0;
  const checks = knownExtensions.map(id =>
    fetch(`chrome-extension://${id}/manifest.json`)
      .then(res => { if (res.ok) count++; })
      .catch(() => {})
  );
  await Promise.all(checks);
  return count;
}

async function detectIncognito() {
  try { return chrome.extension.inIncognitoContext === true; }
  catch (e) { return false; }
}

async function collectFingerprintPopup() {
  const webrtcStatus = await testWebRTC();
  const canvasStatus = testCanvas();
  const audioStatus = await testAudioContext();
  const extCount = await detectExtensions();

  return {
    user_agent: navigator.userAgent,
    platform: navigator.platform,
    languages: navigator.languages,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    webrtc: webrtcStatus,
    canvas: canvasStatus,
    audiocontext: audioStatus,
    extensions_count: extCount,
    incognito_only: await detectIncognito(),
    hardware_concurrency: navigator.hardwareConcurrency,
    device_memory: navigator.deviceMemory || 0,
    ip: "backend"
  };
}

document.addEventListener("DOMContentLoaded", () => {
  const out = document.getElementById("output");

  chrome.storage.local.get("backend_result", (res) => {
    if (!res.backend_result) {
      out.textContent = "Brak danych";
      return;
    }
    out.textContent = JSON.stringify(res.backend_result, null, 2);
  });

  document.getElementById("scan").addEventListener("click", async () => {
    out.textContent = "Zbieram fingerprint...";
    try {
      const fp = await collectFingerprintPopup();
      console.log("FP z popup:", fp);
      chrome.runtime.sendMessage({ action: "scan", data: fp }, (resp) => {
        console.log("sendMessage callback:", resp);
      });
    } catch (e) {
      console.error("Błąd zbierania fingerprintu:", e);
      out.textContent = "Błąd zbierania fingerprintu";
    }
  });
});
