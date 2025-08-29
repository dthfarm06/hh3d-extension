# Boss Helper Chrome Extension - Auto URL Detection

Chrome Extension tự động hỗ trợ đánh boss trong game "Hoang Vực" với tính năng **TỰ ĐỘNG PHÁT HIỆN URL**.

## 🆕 Tính năng mới - Auto URL Detection & Enhanced Countdown Parsing

- 🎯 **Auto URL Detection**: Tự động phát hiện khi mở tab `https://hoathinh3d.mx/hoang-vuc?t=xxxxx`
- 🚀 **Auto Activation**: Tự động kích hoạt extension khi phát hiện URL target
- 🔔 **Smart Notification**: Thông báo khi extension được kích hoạt tự động
- 📊 **Real-time Monitoring**: Theo dõi tab changes và URL updates
- ⏰ **Enhanced Countdown Parsing**: Support format "Chờ X phút Y giây để tấn công lần tiếp theo"
- 🐛 **Debug Logging**: Logging đầy đủ để debug và troubleshoot

## 🕒 Countdown Format Support

Extension hiện hỗ trợ các format countdown sau:

### ✅ Vietnamese Time Formats:
- `"Chờ 12 phút 53 giây để tấn công lần tiếp theo."` → 773 seconds
- `"Còn 10 phút 25 giây"` → 625 seconds  
- `"15 phút 30 giây"` → 930 seconds

### ✅ Colon Time Formats (backup):
- `"Còn 5:30"` → 330 seconds
- `"10:45"` → 645 seconds
- `"1:23:45"` → 5025 seconds

### HTML Element Detection:
Extension tự động detect element `<div id="countdown-timer">` với format:
```html
<div id="countdown-timer" style="color: white; margin-top: 10px;">
    Chờ 12 phút 53 giây để tấn công lần tiếp theo.
</div>
```

## 🚀 Tính năng hiện có

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

## 🎯 URL Pattern Target

Extension sẽ **TỰ ĐỘNG KÍCH HOẠT** khi phát hiện URL theo pattern:
```
https://hoathinh3d.mx/hoang-vuc?t=<số bất kì>
```

### Ví dụ URLs hợp lệ:
- `https://hoathinh3d.mx/hoang-vuc?t=123`
- `https://hoathinh3d.mx/hoang-vuc?t=999999`
- `https://hoathinh3d.mx/hoang-vuc?t=1`
- `https://hoathinh3d.mx/hoang-vuc?t=42&other=param`

### Ví dụ URLs KHÔNG hợp lệ:
- `https://hoathinh3d.mx/hoang-vuc` (thiếu ?t=số)
- `https://hoathinh3d.mx/hoang-vuc?t=` (thiếu số)
- `https://hoathinh3d.mx/hoang-vuc?t=abc` (không phải số)
- `https://othersite.com/hoang-vuc?t=123` (sai domain)

## 🔧 Cài đặt và Test

### Bước 1: Build Extension
```bash
# Chạy build script
build.bat
```

### Bước 2: Install Extension
1. Mở Chrome và vào `chrome://extensions/`
2. Bật "Developer mode" (toggle ở góc phải)
3. Click "Load unpacked"
4. Chọn folder `hh3d-boss`
5. Extension sẽ được load và sẵn sàng sử dụng!

### Bước 3: Test Auto URL Detection

#### 🧪 Phương pháp 1: Test với URL thật
1. Navigate đến: `https://hoathinh3d.mx/hoang-vuc?t=123`
2. Mở Chrome DevTools (F12) → Console tab
3. Kiểm tra logs của extension:
   ```
   [Boss Helper] Target URL detected...
   [Boss Helper] Extension đã phát hiện game và tự động kích hoạt!
   ```
4. Extension sẽ hiện notification và tự động bắt đầu monitor

#### 🧪 Phương pháp 2: Test với Debug Page
1. Mở file `test-url-detection.html` trong Chrome
2. Click các button test để verify URL detection
3. Kiểm tra console logs và status updates
4. Test các URL pattern khác nhau

## 🐛 Debug và Logging

### Console Logs để theo dõi:

#### Background Script Logs:
```javascript
[Boss Helper] Tab listeners initialized
[Boss Helper] Target URL detected in tab 123: https://hoathinh3d.mx/hoang-vuc?t=456
[Boss Helper] Extension activated for tab 123
[Boss Helper] Content script activated successfully in tab 123
```

#### Content Script Logs:
```javascript
[Boss Helper] Initialized in PROD mode
[Boss Helper] Target URL: YES
[Boss Helper] Current URL: https://hoathinh3d.mx/hoang-vuc?t=123
[Boss Helper] Auto-activation triggered for URL: https://hoathinh3d.mx/hoang-vuc?t=123
[Boss Helper] Boss monitor auto-started successfully!
```

### Các bước debug:
1. **Kiểm tra Extension có load không**: Vào `chrome://extensions/` → Tìm "Hoang Vực Auto Boss Helper"
2. **Check console logs**: F12 → Console → Filter by "Boss Helper"
3. **Test URL pattern**: Dùng file `test-url-detection.html`
4. **Check notification**: Extension sẽ hiện popup notification khi activate
5. **Verify badge**: Extension icon sẽ có badge "🎮" và màu xanh khi active

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
