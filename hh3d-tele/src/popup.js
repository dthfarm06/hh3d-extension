document.addEventListener("DOMContentLoaded", () => {
  const resultEl = document.getElementById("result-message");
  const setResult = (msg, isError = false) => {
    if (resultEl) {
      resultEl.textContent = msg;
      resultEl.style.color = isError ? "#c9302c" : "#333";
    }
  };

  // Nút TẾ LỄ (đã có sẵn của bạn)
  const teLeBtn = document.getElementById("te-le-button");
  if (teLeBtn) {
    teLeBtn.addEventListener("click", async () => {
      const url = "https://hoathinh3d.mx/danh-sach-thanh-vien-tong-mon?t=af075";
      try {
        const res = await chrome.runtime.sendMessage({ action: "openAndClick", url });
        if (res?.ok) setResult(res.message || "Đã Tế Lễ");
        else setResult(res?.error || "Lỗi không xác định", true);
      } catch (e) {
        setResult(e?.message || String(e), true);
      }
    });
  }

  // Nút ĐIỂM DANH (mới)
  const diemDanhBtn = document.getElementById("diem-danh-button");
  if (diemDanhBtn) {
    diemDanhBtn.addEventListener("click", async () => {
      const url = "https://hoathinh3d.mx/diem-danh?t=223e4";
      try {
        const res = await chrome.runtime.sendMessage({ action: "checkInCurrentTab", url });
        if (res?.ok) setResult(res.message || "Đã Điểm Danh");
        else setResult(res?.error || "Lỗi không xác định", true);
      } catch (e) {
        setResult(e?.message || String(e), true);
      }
    });
  }
});
