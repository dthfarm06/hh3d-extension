# Hoang Vực Auto Boss Helper - Design Document

## 1. High-Level Design (HLD)

### 1.1 Mục Tiêu
Tự động hỗ trợ người chơi game Hoang Vực đánh boss theo luồng: Khiêu Chiến → Tấn Công → Trở Lại, lặp lại cho đến hết lượt. Hiển thị giao diện trong popup và gửi thông báo khi sẵn sàng.

### 1.2 Kiến trúc tổng thể
```
+----------------+        +-----------------+        +------------------+
|     Popup      | <----> |    Background   | <----> |  Content Script  |
|  popup.js/html |        | background.js   |        |   content.js     |
+----------------+        +-----------------+        +------------------+
       ^                                                        |
       |                                                        |
       +------------> DOM game page (hoathinh3d.mx) <-----------+
```

### 1.3 Các module chính
- **Popup UI**: Cho bật/tắt, hiển thị trạng thái boss.
- **Background Service**: Lưu trạng thái chung, gửi notification, badge.
- **Content Script**: Phân tích DOM, click nút, gửi trạng thái về background.

---

## 2. Low-Level Design (LLD)

### 2.1 PopupController (popup.js)
| Thuộc tính        | Kiểu     | Mô tả                                                   |
|-------------------|----------|-----------------------------------------------------------|
| isAutoEnabled     | boolean  | Trạng thái auto đánh boss                             |
| refreshInterval   | interval | Lịch refresh UI mỗi 3 giây                            |
| unresponsiveTabs  | Set      | Lưu danh sách tab game không tương tác được         |

| Phương thức             | Mô tả                                                                 |
|----------------------|----------------------------------------------------------------------|
| initializeElements   | Gán DOM elements vào this.elements                                 |
| loadSettings         | Load cài đặt từ chrome.storage.sync                        |
| setupEventListeners  | Lắng nghe event checkbox, button                                |
| toggleMonitoring     | Gửi message START/STOP_MONITORING cho content script             |
| refreshState         | Lấy trạng thái từ content/background và hiển thị UI     |
| updateDisplay        | Update UI popup theo gameState                                     |
| updateToggleButton   | Hiển thị icon "Bật/Tắt extension" theo autoEnabled         |


### 2.2 BackgroundManager (background.js)
| Thuộc tính           | Kiểu     | Mô tả                                       |
|---------------------|----------|-------------------------------------------|
| gameState           | object   | Trạng thái mới nhất của boss            |
| lastNotificationTime| number   | Thời gian gửi notification gần nhất |
| activeTabs          | Set      | Danh sách tab đang theo dõi content script     |

| Phương thức             | Mô tả                                                        |
|----------------------|--------------------------------------------------------------|
| handleMessage        | Nhận message từ popup/content                          |
| updateGameState      | Lưu trạng thái mới nhất, update badge, notification     |
| showNotification     | Hiển thị notification theo action                       |
| updateBadge          | Cập nhật badge icon theo status boss                   |
| refreshGameState     | Gửi GET_STATE tới content script để lấy lại state      |
| performHealthCheck   | Kiểm tra các tab active còn sống hay không               |


### 2.3 BossMonitor (content.js)
| Thuộc tính         | Mô tả                                          |
|-------------------|-----------------------------------------------|
| gameState         | status, timeLeft, attacksLeft, bossName       |
| monitorInterval   | setInterval 1 giây theo dõi UI                 |
| countdownInterval | setInterval 1 giây trong khi countdown        |
| isTestMode        | Phân biệt mock/test hay trang thật         |

| Phương thức            | Mô tả                                                      |
|-----------------------|------------------------------------------------------------|
| monitorGameState      | Phân tích DOM để biết trạng thái game                  |
| autoChallenge         | Click nút "Khiêu Chiến" nếu đủ điều kiện            |
| waitForPopupAndAttack | Chờ popup xuất hiện, sau đó tự attack                  |
| autoAttack            | Click nút "Tấn Công" trong popup                          |
| autoClickBackButton   | Click nút "Trở lại", bắt đầu countdown                     |
| startCountdown        | Đếm ngược 20 phút giữa các đòn                         |
| findXButton           | Định vị nút theo selector hoặc text content (reusable)   |


---

## 3. Tài liệu bổ sung
- **UI Spec**: Đã được triển khai trong `popup.html` + `popup.css` (dark, mềm mại, bằng rõ).
- **Assets**: icon16/48/128.png trong folder `icons/`
- **manifest.json**: Đạt đầy đủ permission + background + action + content script.

---

Bạn muốn mình viết thêm phần test case hoặc user guide cho extension này không?

