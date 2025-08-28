// popup.js
// Handle "TẾ LỄ" button: ask background to open the tab and click the button,
// then display the result in the popup.

document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("te-le-button");
  const resultEl = document.getElementById("result-message");

  function setResult(msg, isError = false) {
    if (!resultEl) return;
    resultEl.textContent = msg;
    resultEl.style.color = isError ? "#c9302c" : "#333";
  }

  if (!button) {
    setResult("Button not found in popup.", true);
    return;
  }

  button.addEventListener("click", async () => {
    const url = "https://hoathinh3d.mx/danh-sach-thanh-vien-tong-mon?t=af075";

    try {
      const res = await chrome.runtime.sendMessage({ action: "openAndClick", url });
      if (res?.ok) {
        setResult(res.message || "Done.");
      } else {
        setResult(res?.error || "Unknown error.", true);
      }
    } catch (err) {
      setResult(err?.message || String(err), true);
    }
  });
});
