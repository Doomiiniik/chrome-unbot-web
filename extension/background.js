console.log("Chrome Unbot extension loaded");

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("Message received in background, send to backendu");

  fetch("https://localhost:3000/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(msg.data)
  })
  .then(r => r.json())
  .then(data => {
    chrome.storage.local.set({ backend_result: data }, () => {
      console.log("Result saved to storage");
      sendResponse({ ok: true });
    });
  })
  .catch(err => {
    console.error("Backend error:", err);
    sendResponse({ ok: false, error: err.toString() });
  });

  return true; // <-- KLUCZOWE, ale musi być NA KOŃCU listenera
});
