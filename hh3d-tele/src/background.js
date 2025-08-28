// background.js (MV3)
// Orchestrates: open the tab -> wait for load -> message content script to click the button.

/**
 * Open a tab to the given URL and wait until the page finishes loading.
 * Resolves with the tabId when onCompleted fires for the same URL.
 */
function openTabAndWait(url, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    chrome.tabs.create({ url }).then((tab) => {
      const tabId = tab.id;
      let done = false;
      const timer = setTimeout(() => {
        if (!done) {
          cleanup();
          reject(new Error("Timeout waiting for page load"));
        }
      }, timeoutMs);

      function onCompleted(details) {
        if (details.tabId === tabId && details.url && details.url.startsWith(url)) {
          done = true;
          cleanup();
          resolve(tabId);
        }
      }

      function cleanup() {
        try {
          chrome.webNavigation.onCompleted.removeListener(onCompleted);
        } catch (_) {}
        clearTimeout(timer);
      }

      chrome.webNavigation.onCompleted.addListener(onCompleted);
    }).catch((err) => reject(err));
  });
}

// Optional: keep the last status for popup reads (UX nice-to-have).
let lastClickedStatus = "";

/**
 * Listen for popup requests.
 * - openAndClick: open tab, wait for load, tell content.js to click the button
 * - getStatus: return last status for UI
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      if (request.action === "openAndClick") {
        const url = request.url;
        const tabId = await openTabAndWait(url, 30000);
        const res = await chrome.tabs.sendMessage(tabId, { action: "clickTeLeButton" });
        lastClickedStatus = res?.status || "unknown";
        sendResponse({ ok: true, ...res });
      } else if (request.action === "getStatus") {
        sendResponse({ ok: true, status: lastClickedStatus || "idle" });
      } else if (request.action === "updateStatus") {
        lastClickedStatus = request.status || "";
        sendResponse({ ok: true });
      } else {
        sendResponse({ ok: false, error: "Unknown action" });
      }
    } catch (err) {
      sendResponse({ ok: false, error: err?.message || String(err) });
    }
  })();

  // Indicate we will respond asynchronously.
  return true;
});
