console.log("Chrome Unbot extension loaded");

// Listener na kliknięcie w popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "scan") {
    collectFingerprint().then(fp => {
      console.log("Fingerprint z extension:", fp);

      // wysyłamy do backendu
      fetch("http://localhost:3000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fp)
      })
      
      .then(res => res.json())
   .then(data => {
    console.log("Odpowiedź backendu:", data);

    chrome.storage.local.set({ backend_result: data });

    console.log("Publiczne IP:", data.ip);
});

    });
  }
});

async function collectFingerprint() {
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



async function testWebRTC() {
  try {
    const pc = new RTCPeerConnection({ iceServers: [] });

    pc.createDataChannel("test");

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    return new Promise(resolve => {
      pc.onicecandidate = event => {
        if (event.candidate) {
          resolve("enabled");
          pc.close();
        }
      };

      // jeśli po 1 sekundzie brak ICE → WebRTC wyłączone
      setTimeout(() => {
        resolve("disabled");
        pc.close();
      }, 1000);
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

    if (!data || data.length < 50) {
      return "blocked";
    }

    // noise detection: fingerprint too short or too weird
    if (data.length < 300) {
      return "noise";
    }

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

    // jeśli bufor jest pusty → blokada
    if (!buffer || buffer.length === 0) {
      return "blocked";
    }

    return "ok";
  } catch (e) {
    return "blocked";
  }
}


async function detectExtensions() {
 const knownExtensions = [
  "cjpalhdlnbpafiamejdnhcphjbkeiagm", // uBlock Origin
  "gighmmpiobklfepjocnamgkkbiglidom", // Adblock
  "aapbdbdomjkkjkaonfhkkikfgjllcleb", // Google Translate
  "nkbihfbeogaeaoehlefnkodbefgpgknn", // MetaMask
  "fmkadmapgofadopljbjfkapdkoienihi", // React DevTools
  "lmhkpmbekcpmknklioeibfkpmmfibljd", // Redux DevTools
  "eimadpbcbfnmbkopoojfekhnkhdbieeh", // Dark Reader
  "bhghoamapcdpbohphigoooaddinpkbai", // Honey
  "bgnkhhnnamicmpeenaelnjfhikgbkllg", // Grammarly
  "aeblfdkhhhdcdjpifhhbdiojplfjncoa", // LastPass
  "hdokiejnpimakedhajhdlcegeplioahd", // Pocket
  "coobgpohoikkiipiblmjeljniedjpjpf", // Google Keep
  "apdfllckaahabafndbhieahigkjlhalf", // Google Docs Offline
  "mhjfbmdgcfjbbpaeojofohoefgiehjai", // Chrome PDF Viewer
  "blpcfgokakmgnkcojhhkbfbldkacnbeo", // YouTube
  "pjkljhegncpnkpknbcohdijeoejaedia", // Gmail
  "nmmhkkegccagdldgiimedpiccmgmieda", // Chrome Web Store Payments
  "kbmfpngjjgdllneeigpgjifpgocmfgmb", // Chrome Remote Desktop
  "ghbmnnjooekpmoecnnnilnnbdlolhkhi"  // Google Docs
 
];

  let count = 0;

  const checks = knownExtensions.map(id => {
    return fetch(`chrome-extension://${id}/manifest.json`)
      .then(res => {
        if (res.ok) count++;
      })
      .catch(() => {});
  });

  await Promise.all(checks);

  return count;
}


async function detectIncognito() {
  try {
    return chrome.extension.inIncognitoContext === true;
  } catch (e) {
    return false;
  }
}
