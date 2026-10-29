   module.exports = { analyzeFingerprint, validateFingerprint };

   function validateFingerprint(fp) {
     if (typeof fp !== "object" || fp === null || Array.isArray(fp)) {
       return "Body must be a JSON object";
     }
   
     if (fp.hardware_concurrency !== undefined &&
         typeof fp.hardware_concurrency !== "number") {        
       return "hardware_concurrency must be a number";
     }
   
     if (fp.user_agent !== undefined &&
         (typeof fp.user_agent !== "string" || fp.user_agent.length > 500)) {  
       return "user_agent must be a string up to 500 chars";
     }
   
     if (fp.device_memory !== undefined &&
         (typeof fp.device_memory !== "number" )) { 
       return "device_memory must be a number";
     }
     return null;
   }
   
   function analyzeFingerprint(fp = {}, clientIp = null, headerUA = null) {
     let score = 0;
     let reasons = [];
     let fixes = [];
   
    if (fp.user_agent && headerUA && fp.user_agent !== headerUA) {
       score+=40;
       reasons.push("User-Agent header doesn't match fingerprint");
       fixes.push("Disable User-Agent spoofing extensions");
     }
   
   
   
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
    
     if (fp.navigator_entropy?.webdriver === true) {
       score += 50;
       reasons.push("Browser is controlled by automation");
       fixes.push("Use a normal browser, not an automated one");
     }
   
     if (fp.user_agent?.includes("HeadlessChrome")) {
       score += 50;
       reasons.push("Browser works in headless mode");
       fixes.push("Use normal browser mode");
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