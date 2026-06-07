console.log("Chrome Unbot extension loaded");

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "scan") {
    console.log("Message received in background, wysyłam do backendu");
    const fp = msg.data;

    fetch("http://localhost:3000/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fp)
    })
      .then(res => res.json())
      .then(data => {
        console.log("Odpowiedź backendu:", data);
        chrome.storage.local.set({ backend_result: data }, () => {
          sendResponse({ ok: true });
        });
      })
      .catch(err => {
        console.error("Backend error:", err);
        sendResponse({ ok: false, error: String(err) });
      });

    return true; // async response
  }
});
