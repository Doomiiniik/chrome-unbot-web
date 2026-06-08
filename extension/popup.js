console.log("POPUP JS LOADED");

// ----------------------
// TEST: WebRTC
// ----------------------
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

// ----------------------
// TEST: Canvas
// ----------------------
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

// ----------------------
// TEST: AudioContext
// ----------------------
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

// ----------------------
// TEST: Known Extensions
// ----------------------
async function detectExtensions() {
  return { count: 0 };
}

// ----------------------
// TEST: Incognito
// ----------------------
async function detectIncognito() {
  try { return chrome.extension.inIncognitoContext === true; }
  catch (e) { return false; }
}

// ----------------------
// TEST: WebGL
// ----------------------
function testWebGL() {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return { status: "blocked" };

    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");

    const vendor = debugInfo 
      ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
      : "unknown";

    const renderer = debugInfo 
      ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      : "unknown";

    return {
      status: "ok",
      vendor,
      renderer
    };
  } catch (e) {
    return { status: "blocked" };
  }
}

// ----------------------
// COLLECT FINGERPRINT
// ----------------------
async function collectFingerprint() {
  console.log("SCAN CLICKED");

  const webrtcStatus = await testWebRTC();
  const canvasStatus = testCanvas();
  const audioStatus = await testAudioContext();
  const extCount = await detectExtensions();

  const navigatorEntropy = {
    webdriver: navigator.webdriver === true,
    plugins_count: navigator.plugins ? navigator.plugins.length : 0,
    mimetypes_count: navigator.mimeTypes ? navigator.mimeTypes.length : 0,
    max_touch_points: navigator.maxTouchPoints || 0
  };

  const screenFingerprint = {
    screen_width: window.screen.width,
    screen_height: window.screen.height,
    avail_width: window.screen.availWidth,
    avail_height: window.screen.availHeight,
    inner_width: window.innerWidth,
    inner_height: window.innerHeight,
    device_pixel_ratio: window.devicePixelRatio || 1
  };

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
    webgl: testWebGL(),
    navigator_entropy: navigatorEntropy,
    screen_fingerprint: screenFingerprint,
    ip: "backend"
  };
}
async function collectFingerprintPopup() {
  console.log("SCAN CLICKED");

  const fp = await collectFingerprint();

  console.log("sending message to background");

  chrome.runtime.sendMessage(
    { action: "scan", data: fp },
    (response) => {
      console.log("response from background:", response);

      chrome.storage.local.get("backend_result", (res) => {
        if (res.backend_result) {
          renderUI(res.backend_result);
        }
      });
    }
  );
}

// ----------------------
// RENDER UI
// ----------------------
function renderUI(data) {
  const scoreBox = document.getElementById("scoreBox");
  const reasonsList = document.getElementById("reasons");
  const fixesList = document.getElementById("fixes");
  const metaBox = document.getElementById("meta");

  // SCORE
  scoreBox.textContent = data.score;

  if (data.score <= 30) scoreBox.style.color = "#4caf50";
  else if (data.score <= 60) scoreBox.style.color = "#ff9800";
  else scoreBox.style.color = "#f44336";

  // REASONS
  reasonsList.innerHTML = "";
  data.reasons.forEach(r => {
    const li = document.createElement("li");
    li.innerHTML = `⚠️ ${r}`;
    li.style.marginBottom = "4px";
    reasonsList.appendChild(li);
  });

  // FIXES
  fixesList.innerHTML = "";
  data.fixes_preview.forEach(f => {
    const li = document.createElement("li");
    li.innerHTML = `✔️ ${f}`;
    li.style.marginBottom = "4px";
    fixesList.appendChild(li);
  });

  // META
  metaBox.textContent = `IP: ${data.ip}`;
}

// ----------------------
// BUTTON HANDLER
// ----------------------
document.getElementById("scan").addEventListener("click", () => {
  collectFingerprintPopup();
});
