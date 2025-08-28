# Boss Helper Chrome Extension

Chrome Extension tự động hỗ trợ đánh boss trong game "Bí Cảnh Tông Môn".

## 🚀 Tính năng

- ✅ **Auto Monitor**: Theo dõi trạng thái boss real-time  
- ✅ **Auto Challenge**: Tự động click "Khiêu Chiến" khi sẵn sàng
- ✅ **Auto Attack**: Tự động click "Tấn Công" trong popup
- ✅ **Background Operation**: Hoạt động ngầm kể cả tab inactive
- ✅ **Smart Notifications**: Thông báo khi sẵn sàng đánh boss
- ✅ **Attack Counter**: Theo dõi số lượt đánh còn lại (5/ngày)
- ✅ **Test Mode**: Hỗ trợ test với file HTML local

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
1. Mở file `mock/mock-bicanh.html` trong browser
2. Click icon extension → Popup sẽ hiện "Mode: TEST"
3. Bật extension và xem countdown

#### PROD MODE (Website):
1. Vào `https://hoathinh3d.mx/bi-canh-tong-mon` (có thể có query parameters như `?t=d3b93`)
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
Khi bật extension:
1. **Auto Challenge**: Tự động click "Khiêu Chiến" khi countdown = 0
2. **Auto Attack**: Tự động click "Tấn Công" trong popup battle
3. **Smart Timing**: Chờ DOM load và kiểm tra elements

## 🎯 Modes

### TEST MODE
- **URL**: `file://*/*mock-bicanh.html*`
- **Mục đích**: Development và testing
- **Tính năng**: Đầy đủ như PROD mode

### PROD MODE  
- **URL**: `https://hoathinh3d.mx/bi-canh-tong-mon*` (bao gồm query parameters như `?t=d3b93`)
- **Mục đích**: Sử dụng thực tế trên game
- **Tính năng**: Full automation

## 🔍 Troubleshooting

### Extension không hoạt động
1. **Kiểm tra URL**: Đảm bảo đang ở đúng trang game
2. **Refresh tab**: F5 để reload content script
3. **Check console**: F12 → Console xem errors
4. **Reload extension**: Tắt bật extension trong `chrome://extensions/`

### Không auto-click được nút "Tấn Công"
1. **Popup timing**: Popup cần thời gian load, extension đợi 1.5s
2. **Button detection**: Extension tìm theo:
   - Primary: `#attack-boss-btn` (ID)
   - Fallback: `.attack-button` (class)
   - Final: Text content "TẤN CÔNG"
3. **HTML Structure**: Button HTML:
   ```html
   <button id="attack-boss-btn" class="attack-button">
     <i class="fas fa-fist-raised"></i> Tấn Công
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
