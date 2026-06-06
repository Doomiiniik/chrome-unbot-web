document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("scan").addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "scan" }, () => {});
  });
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "backend_result") {
    const el = document.getElementById("result");
    if (el) {
      el.textContent = JSON.stringify(msg.data, null, 2);
    }
  }
});
