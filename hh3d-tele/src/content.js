// content.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "clickTeLeButton") {
    try {
      // 1. Tìm nút "Tế Lễ" đầu tiên (ở trang)
      const firstBtn =
        document.getElementById("te-le-button") ||
        Array.from(document.querySelectorAll("button, a, [role='button']"))
          .find(el => (el.textContent || "").trim().includes("Tế Lễ"));

      if (firstBtn) {
        firstBtn.click();

        // 2. Đợi popup SweetAlert2 render rồi bấm tiếp nút confirm
        const tryClickConfirm = () => {
          const confirmBtn = document.querySelector("button.swal2-confirm");
          if (confirmBtn && confirmBtn.textContent.includes("Tế Lễ")) {
            confirmBtn.click();
            sendResponse({ status: "success", message: "Đã bấm Tế Lễ và xác nhận popup." });
          } else {
            // nếu chưa thấy, thử lại sau 200ms
            setTimeout(tryClickConfirm, 200);
          }
        };

        tryClickConfirm();
      } else {
        sendResponse({ status: "error", message: "Không tìm thấy nút Tế Lễ ban đầu." });
      }
    } catch (err) {
      sendResponse({ status: "error", message: err?.message || String(err) });
    }
    return true; // giữ channel mở vì dùng setTimeout
  }
});
