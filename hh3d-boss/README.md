# Boss Helper Chrome Extension

Chrome Extension tự động hỗ trợ đánh boss trong game "Hoang Vực".

## 🚀 Tính năng

- ✅ **Auto Monitor**: Theo dõi trạng thái boss real-time  
- ✅ **Auto Challenge**: Tự động click "Khiêu Chiến" khi sẵn sàng
- ✅ **Auto Attack**: Tự động click "Tấn Công" trong popup
- ✅ **Auto Back**: Tự động click "Trở lại" sau khi tấn công
- ✅ **Auto Cycle**: Tự động lặp lại toàn bộ quy trình 5 lần trong ngày
- ✅ **Smart Countdown**: Countdown 20 phút giữa các lượt đánh
- ✅ **Background Operation**: Hoạt động ngầm kể cả tab inactive
- ✅ **Smart Notifications**: Thông báo khi sẵn sàng đánh boss
- ✅ **Attack Counter**: Theo dõi số lượt đánh còn lại (5/ngày)
- ✅ **Test Mode**: Countdown 30s cho test, 20 phút cho production

## 🔧 Cài đặt

### Bước 1: Chuẩn bị
1. Đảm bảo bạn có Google Chrome hoặc Microsoft Edge
2. Download/clone folder `chrome-extension` này

### Bước 2: Tạo icon (tuỳ chọn)
Nếu muốn icon đẹp hơn, tạo 3 files PNG:
- `icons/icon16.png` (16x16px)
- `icons/icon48.png` (48x48px)  
- `icons/icon128.png` (128x128px)

Hoặc sử dụng icon SVG có sẵn trong folder.

### Bước 3: Load Extension
1. Mở Chrome → Vào `chrome://extensions/`
2. Bật **Developer mode** (góc trên bên phải)
3. Click **Load unpacked**
4. Chọn folder `chrome-extension`
5. Extension sẽ xuất hiện trong danh sách

### Bước 4: Test
#### TEST MODE (Local File):
1. Mở file `../mock/mock-boss.html` trong browser
2. Click "Test Mode (30s countdown)" để chuyển sang countdown ngắn
3. Click icon extension → Popup sẽ hiện "Mode: TEST"
4. Bật extension và xem auto-cycle với countdown 30s

#### PROD MODE (Website):
1. Vào `https://hoathinh3d.mx/hoang-vuc` (có thể có query parameters như `?t=b3ddd`)
2. Click icon extension → Popup sẽ hiện "Mode: PROD"  
3. Bật extension và để chạy tự động

## 📱 Cách sử dụng

### 1. Mở Popup
- Click icon 🐉 trên toolbar
- Popup hiển thị trạng thái hiện tại

### 2. Settings
- ☑️ **Tự động đánh boss**: Bật/tắt auto-click
- ☑️ **Thông báo khi sẵn sàng**: Desktop notification  
- ☑️ **Âm thanh cảnh báo**: Sound alert (future)

### 3. Monitoring
Extension sẽ hiển thị:
- **Trạng thái**: Đang đếm ngược / Sẵn sàng / Hết lượt
- **Thời gian**: Countdown timer (MM:SS)
- **Lượt đánh**: Số lượt còn lại (X/5)
- **Boss**: Tên boss hiện tại

### 4. Auto Actions
Khi bật extension, quy trình auto-boss được thực hiện liên tục cho đến khi hết 5 lượt:

**Một lượt đánh boss:**
1. **Auto Challenge**: Tìm text "KHIÊU CHIẾN" và click button (chỉ khi countdown = 0)
2. **Wait Popup**: Đợi popup hiển thị hoàn toàn (check mỗi 200ms, tối đa 15s)
3. **Auto Attack**: Tìm button "⚔️Tấn Công" (onclick="attackBoss()") và click
4. **Wait 2s**: Đợi 2 giây để xử lý kết quả tấn công
5. **Auto Back**: Tìm button "Trở lại" (onclick="endBattle()") và click
6. **Start Countdown**: Bắt đầu countdown 20 phút cho lượt tiếp theo
7. **Wait Complete**: Đợi countdown hoàn thành trước khi tìm button "KHIÊU CHIẾN" lại

**Chu trình hoàn chỉnh:**
- Extension sẽ tự động lặp lại quy trình trên **5 lần trong ngày**
- Mỗi lượt cách nhau **đúng 20 phút** (hoặc 30s trong test mode)
- **Không tìm button "KHIÊU CHIẾN" trong lúc countdown**
- Chỉ auto challenge khi countdown hoàn thành và status = 'ready'
- Sau khi hoàn thành 5/5 lượt, extension dừng và thông báo hoàn thành

## 🎯 Modes

### TEST MODE
- **URL**: `file://*/*mock-boss.html*` (và `mock-bicanh.html`)
- **Mục đích**: Development và testing workflow đánh boss
- **Tính năng**: Đầy đủ workflow như PROD mode

### PROD MODE  
- **URL**: `https://hoathinh3d.mx/hoang-vuc*` (bao gồm query parameters như `?t=b3ddd`)
- **Mục đích**: Sử dụng thực tế trên game Hoang Vực
- **Tính năng**: Full automation

## 🔍 Troubleshooting

### Extension không hoạt động
1. **Kiểm tra URL**: Đảm bảo đang ở đúng trang game
2. **Refresh tab**: F5 để reload content script
3. **Check console**: F12 → Console xem errors
4. **Reload extension**: Tắt bật extension trong `chrome://extensions/`

### Không auto-click được nút "Tấn Công"
1. **Popup timing**: Popup cần thời gian load, extension đợi 1s sau khi detect popup
2. **Button detection**: Extension tìm theo:
   - Primary: `onclick="attackBoss()"` attribute
   - Fallback: Text content "⚔️Tấn Công" hoặc "Tấn Công"
   - Final: Class `.attack-button`
3. **Expected HTML Structure**: 
   ```html
   <button class="attack-button" onclick="attackBoss()">⚔️Tấn Công</button>
   ```

### Không auto-click được nút "Trở lại"
1. **Timing**: Extension đợi 2s sau khi attack trước khi tìm back button
2. **Button detection**: Extension tìm theo:
   - Primary: `onclick="endBattle()"` attribute  
   - Fallback: Text content "Trở lại"
   - Final: Class `.back-button`
3. **Expected HTML Structure**:
   ```html
   <button class="back-button" onclick="endBattle()">Trở lại</button>
   ```

### Countdown không chính xác
1. **Manual countdown**: Extension tự tạo countdown 20 phút sau khi click "Trở lại"
2. **Priority**: Manual countdown có độ ưu tiên cao hơn game countdown
3. **Reset**: Countdown reset khi stop/start extension
   </button>
   ```
4. **Console debug**: F12 → Console xem logs "Looking for attack button"

Để debug chi tiết:
```javascript
// Mở console trong tab game và chạy:
const popup = document.getElementById('boss-damage-screen');
if (popup) {
  console.log('Attack button:', popup.querySelector('#attack-boss-btn'));
  console.log('All buttons in popup:', 
    Array.from(popup.querySelectorAll('button')).map(btn => ({
      text: btn.textContent.trim(),
      id: btn.id,
      className: btn.className
    }))
  );
}
```

### Popup không hiển thị trạng thái  
1. **Tab active**: Đảm bảo có ít nhất 1 tab game đang mở
2. **Content script**: Check xem content script đã inject chưa
3. **Background**: Service worker có thể đã sleep

## 🛠️ Development

### File Structure
```
chrome-extension/
├── manifest.json          # Extension config
├── content.js             # Game monitoring script  
├── background.js          # Service worker
├── popup.html            # UI interface
├── popup.css             # UI styles
├── popup.js              # UI logic
└── icons/                # Extension icons
```

### Key Components
- **Content Script**: Inject vào game page, monitor DOM
- **Background Worker**: Manage state, notifications, alarms
- **Popup Interface**: User controls và status display

### Debugging
1. **Content Script**: F12 → Console trong tab game
2. **Background**: `chrome://extensions/` → Inspect service worker  
3. **Popup**: Right-click popup → Inspect

## 📋 TODO/Future Features

- [ ] 🔊 Sound notifications
- [ ] 📊 Statistics tracking  
- [ ] ⏰ Schedule attacks
- [ ] 🏆 Multi-boss support
- [ ] 📱 Mobile companion app
- [ ] 🔗 Discord integration

## ⚠️ Disclaimer

Extension này chỉ simulate user clicks và không:
- Modify game code
- Bypass game mechanics  
- Violate game ToS (trong giới hạn hợp lý)
- Access sensitive data

Sử dụng với trách nhiệm của bản thân.

## 📞 Support

Nếu gặp issues:
1. Check console logs
2. Disable/enable extension
3. Report với screenshots

---

**Version**: 1.0.0  
**Compatibility**: Chrome 88+, Edge 88+  
**License**: MIT
