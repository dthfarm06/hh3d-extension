const runningEl = document.getElementById("running");
const currentIdxEl = document.getElementById("currentIdx");
const countdownEl = document.getElementById("countdown");

function fmt(ms) {
  if (!ms || ms < 0) return "0s";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}m ${r}s` : `${r}s`;
}

function tick() {
  chrome.runtime.sendMessage({ type: "GET_STATUS" }, (st) => {
    const now = Date.now();
    const next = st?.nextCycleAt ? st.nextCycleAt : now;
    const remain = next - now;

    runningEl.textContent = st?.isRunning ? "Có" : "Không";
    currentIdxEl.textContent = st?.currentIndex >= 0 ? `${st.currentIndex + 1}` : "—";
    countdownEl.textContent = st?.isRunning ? "Đang chạy chu kỳ" : fmt(remain);
  });
}

tick();
setInterval(tick, 1000);
