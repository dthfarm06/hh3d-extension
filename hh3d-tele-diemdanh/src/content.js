chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // TẾ LỄ
  if (request.action === "clickTeLeButton") {
    try {
      const firstBtn =
        document.getElementById("te-le-button") ||
        Array.from(document.querySelectorAll("button, a, [role='button']"))
          .find(el => (el.textContent || "").trim().includes("Tế Lễ"));

      if (!firstBtn) {
        sendResponse({ status: "error", message: "Không tìm thấy nút Tế Lễ ban đầu." });
        return;
      }

      firstBtn.click();

      const tryClickConfirm = () => {
        const confirmBtn = document.querySelector("button.swal2-confirm");
        if (confirmBtn && (confirmBtn.textContent || "").includes("Tế Lễ")) {
          confirmBtn.click();
          sendResponse({ status: "success", message: "Đã bấm Tế Lễ và xác nhận popup." });
        } else {
          setTimeout(tryClickConfirm, 200);
        }
      };
      tryClickConfirm();
    } catch (err) {
      sendResponse({ status: "error", message: err?.message || String(err) });
    }
    return true; // async

  // ĐIỂM DANH
  } else if (request.action === "clickCheckInButton") {
    try {
      const start = Date.now();
      const timeoutMs = 10000;

      const tryClick = () => {
        // Ưu tiên id đúng bài toán
        let btn = document.getElementById("checkInButton");

        // Phòng khi trang đổi id: fallback tìm theo text "Điểm Danh"
        if (!btn) {
          btn = Array.from(document.querySelectorAll("button, a, [role='button']"))
            .find(el => (el.textContent || "").trim().includes("Điểm Danh"));
        }

        if (btn) {
          btn.click();
          sendResponse({ status: "success", message: "Đã click nút Điểm Danh." });
        } else if (Date.now() - start < timeoutMs) {
          setTimeout(tryClick, 200);
        } else {
          sendResponse({ status: "error", message: "Không tìm thấy nút Điểm Danh trong trang." });
        }
      };

      tryClick();
    } catch (err) {
      sendResponse({ status: "error", message: err?.message || String(err) });
    }
    return true; // async
  }
});
