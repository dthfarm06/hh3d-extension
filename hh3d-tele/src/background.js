// ========== helper chung ==========
function waitForTabCompleted(tabId, expectedUrlPrefix, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    let done = false;
    const timer = setTimeout(() => {
      if (!done) {
        cleanup();
        reject(new Error("Timeout chờ trang tải xong"));
      }
    }, timeoutMs);

    function onCompleted(details) {
      if (details.tabId === tabId && details.url && details.url.startsWith(expectedUrlPrefix)) {
        done = true;
        cleanup();
        resolve();
      }
    }
    function cleanup() {
      try { chrome.webNavigation.onCompleted.removeListener(onCompleted); } catch {}
      clearTimeout(timer);
    }

    chrome.webNavigation.onCompleted.addListener(onCompleted);
  });
}

async function getActiveTabId() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab?.id) throw new Error("Không tìm thấy tab đang hoạt động");
  return tab.id;
}

// ========== listener ==========
let lastClickedStatus = "";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      if (request.action === "openAndClick") {
        // TẾ LỄ (giữ nguyên logic bạn đang dùng)
        const url = request.url;
        const tab = await chrome.tabs.create({ url });
        await waitForTabCompleted(tab.id, url, 30000);
        const res = await chrome.tabs.sendMessage(tab.id, { action: "clickTeLeButton" });
        lastClickedStatus = res?.status || "unknown";
        sendResponse({ ok: true, ...res });

      } else if (request.action === "checkInCurrentTab") {
        // ĐIỂM DANH (mới) – mở trong tab hiện tại
        const url = request.url;
        const tabId = await getActiveTabId();
        await chrome.tabs.update(tabId, { url }); // mở URL trong tab hiện tại
        await waitForTabCompleted(tabId, "https://hoathinh3d.mx/diem-danh", 30000);

        const res = await chrome.tabs.sendMessage(tabId, { action: "clickCheckInButton" });
        lastClickedStatus = res?.status || "unknown";
        sendResponse({ ok: true, ...res });

      } else if (request.action === "getStatus") {
        sendResponse({ ok: true, status: lastClickedStatus || "idle" });
      } else {
        sendResponse({ ok: false, error: "Unknown action" });
      }
    } catch (err) {
      sendResponse({ ok: false, error: err?.message || String(err) });
    }
  })();
  return true; // async response
});
