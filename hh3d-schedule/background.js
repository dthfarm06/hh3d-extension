// Timed URL Cycler - background.js (MV3)
// Logic:
// - Mỗi 15 phút (default) đặt alarm "start_cycle".
// - Khi alarm nổ: chạy một chu kỳ duyệt URL_PAIRS.
// - Với mỗi cặp: mở tab openUrl -> chờ openDwellMs -> update sang replaceUrl -> chờ replaceDwellMs -> đóng tab.
// - Khi xong hết: đặt lại alarm sau delayMinutes.

const DEFAULT_CONFIG = {
  delayMinutes: 1,         // Khoảng nghỉ giữa các chu kỳ (phút)
  openDwellMs: 60_000,      // Thời gian giữ openUrl trước khi thay thế (ms)
  replaceDwellMs: 10_000,   // Thời gian giữ sau khi thay thế trước khi đóng tab (ms)
  urlPairs: [
    { openUrl: "https://example.com/a", replaceUrl: "https://example.com/a2" },
    { openUrl: "https://example.com/b", replaceUrl: "https://example.com/b2" }
  ]
};

// Trạng thái đang chạy để tránh chạy chồng chu kỳ
let isRunning = false;

// Tiện ích sleep
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Lấy config từ storage (hợp nhất với default)
async function getConfig() {
  const data = await chrome.storage.local.get(["delayMinutes", "openDwellMs", "replaceDwellMs", "urlPairs"]);
  return {
    delayMinutes: Number.isFinite(data.delayMinutes) ? data.delayMinutes : DEFAULT_CONFIG.delayMinutes,
    openDwellMs: Number.isFinite(data.openDwellMs) ? data.openDwellMs : DEFAULT_CONFIG.openDwellMs,
    replaceDwellMs: Number.isFinite(data.replaceDwellMs) ? data.replaceDwellMs : DEFAULT_CONFIG.replaceDwellMs,
    urlPairs: Array.isArray(data.urlPairs) && data.urlPairs.length ? data.urlPairs : DEFAULT_CONFIG.urlPairs
  };
}

// Đặt alarm bắt đầu chu kỳ sau N phút
async function scheduleNextCycle(minutes) {
  const when = Date.now() + minutes * 60_000;
  await chrome.alarms.create("start_cycle", { when });
  await chrome.storage.local.set({ nextCycleAt: when });
}

// Chạy một chu kỳ duyệt cặp URL
async function runCycle() {
  if (isRunning) return;
  isRunning = true;

  try {
    const cfg = await getConfig();
    const pairs = cfg.urlPairs;

    // Lưu trạng thái để popup hiển thị
    await chrome.storage.local.set({ isRunning: true, currentIndex: -1 });

    for (let i = 0; i < pairs.length; i++) {
      const { openUrl, replaceUrl } = pairs[i] || {};
      if (!openUrl || !replaceUrl) continue;

      // Cập nhật index đang chạy
      await chrome.storage.local.set({ currentIndex: i });

      // 1) Mở tab với openUrl
      let createdTab;
      try {
        createdTab = await chrome.tabs.create({ url: openUrl, active: false }); // không cần focus tab
      } catch (err) {
        console.error("Cannot create tab:", err);
        continue; // chuyển sang cặp kế
      }

      // 2) Chờ openDwellMs
      await sleep(cfg.openDwellMs);

      // 3) Thay thế URL bằng replaceUrl (cùng tab)
      try {
        await chrome.tabs.update(createdTab.id, { url: replaceUrl });
      } catch (err) {
        console.error("Cannot update tab:", err);
        // Thử đóng nếu update lỗi
        try { createdTab.id && (await chrome.tabs.remove(createdTab.id)); } catch {}
        continue;
      }

      // 4) Chờ thêm replaceDwellMs rồi đóng tab
      await sleep(cfg.replaceDwellMs);
      try {
        createdTab.id && (await chrome.tabs.remove(createdTab.id));
      } catch (err) {
        console.warn("Cannot close tab (maybe user closed):", err);
      }
    }
  } catch (err) {
    console.error("Cycle failed:", err);
  } finally {
    // Kết thúc chu kỳ -> đặt lại alarm sau delayMinutes
    const cfg = await getConfig();
    await scheduleNextCycle(cfg.delayMinutes);
    await chrome.storage.local.set({ isRunning: false, currentIndex: -1 });
    isRunning = false;
  }
}

// Xử lý alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "start_cycle") {
    runCycle();
  }
});

// Lần cài đặt đầu tiên: đặt alarm nếu chưa có
chrome.runtime.onInstalled.addListener(async () => {
  const alarms = await chrome.alarms.getAll();
  const hasStart = alarms.some(a => a.name === "start_cycle");
  if (!hasStart) {
    await scheduleNextCycle(DEFAULT_CONFIG.delayMinutes);
  }
});

// Cho popup đọc countdown
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "GET_STATUS") {
    chrome.storage.local.get(["nextCycleAt", "isRunning", "currentIndex"]).then((st) => {
      sendResponse(st);
    });
    return true; // async
  }
});
