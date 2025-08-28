# PHÚC LỢI ĐƯỜNG Extension

Chrome Extension tự động hóa chức năng Phúc Lợi Đường cho game hoathinh3d.mx

## 🎁 Tính năng

- **Tự động mở rương Phúc Lợi Đường** theo thứ tự: Phàm Giới → Thiên Cơ → Địa Nguyên → Chí Tôn
- **Chu trình tự động**: Chạy 4 chu trình, mỗi chu trình 30 phút
- **Đếm ngược thời gian**: Hiển thị thời gian còn lại của mỗi chu trình
- **Khôi phục trạng thái**: Tự động khôi phục trạng thái khi đóng/mở extension
- **Test Mode**: Hỗ trợ test với file local

## 🚀 Cài đặt

1. Mở Chrome và vào `chrome://extensions/`
2. Bật **Developer mode** ở góc trên bên phải
3. Click **Load unpacked**
4. Chọn thư mục `hh3d-phucloiduong`
5. Extension sẽ xuất hiện trong thanh công cụ Chrome

## 📱 Sử dụng

### Cách 1: Tự động
1. Mở trang https://hoathinh3d.mx/phuc-loi-duong
2. Extension sẽ tự động mở rương theo thứ tự

### Cách 2: Thủ công  
1. Click vào icon extension trên thanh Chrome
2. Click nút **PHÚC LỢI ĐƯỜNG**
3. Extension sẽ:
   - Mở trang Phúc Lợi Đường
   - Tự động click rương theo thứ tự
   - Chạy 4 chu trình, mỗi chu trình 30 phút
   - Hiển thị đếm ngược thời gian

## ⚙️ Cấu hình

### Test Mode
- Bật **Test Mode** để sử dụng file test local
- Tắt **Test Mode** để sử dụng website thực

### URL Configuration (config.js)
```javascript
PROD_URLS: {
    PHUC_LOI_DUONG: 'https://hoathinh3d.mx/phuc-loi-duong'
}
```

## 🔧 Thứ tự mở rương

Extension sẽ tự động mở rương theo thứ tự:

1. **Phàm Giới** (`pham-gioi-close.png` → `pham-gioi-open.png`)
2. **Thiên Cơ** (`thien-co-close.png` → `thien-co-open.png`)  
3. **Địa Nguyên** (`dia-nguyen-close.png` → `dia-nguyen-open.png`)
4. **Chí Tôn** (`chi-ton-close.png` → `chi-ton-open.png`)

## 📊 Chu trình hoạt động

- **Tổng chu trình**: 4 chu trình
- **Thời gian mỗi chu trình**: 30 phút
- **Tổng thời gian**: 2 giờ
- **Tự động khởi động lại**: Sau mỗi 30 phút

## 🎮 UI Controls

### Button States
- **PHÚC LỢI ĐƯỜNG**: Trạng thái sẵn sàng
- **PHÚC LỢI ĐƯỜNG 1/4 [Time] (Click để dừng)**: Đang chạy chu trình 1
- **ĐANG CHẠY 2/4 (Click để dừng)**: Đang chạy chu trình 2

### Colors
- **Tím**: Trạng thái bình thường
- **Đỏ**: Đang chạy  
- **Xanh lá**: Hoàn thành

## 🐛 Debug & Logs

Mở **Developer Tools** (F12) để xem logs:

```javascript
// Background script logs
🚀 PHÚC LỢI ĐƯỜNG Background script khởi động
🎁 Detected Phúc Lợi Đường page, triggering auto-click...

// Content script logs  
🎁 Bắt đầu tìm và click rương phúc lợi theo thứ tự...
✅ Tìm thấy rương Phàm Giới chưa mở
✅ Đã click rương Phàm Giới thành công
```

## 📁 File Structure

```
hh3d-phucloiduong/
├── manifest.json          # Extension manifest
├── popup.html             # UI popup  
├── popup.js              # UI logic
├── content.js            # Page content script
├── background.js         # Background service worker
├── config.js            # URL configuration
├── styles.css           # Additional styles (unused)
├── force-click.js       # Force click utilities (unused)
├── images/              # Extension icons
│   ├── icon16.png
│   ├── icon48.png  
│   └── icon128.png
└── README.md           # This file
```

## 🔒 Permissions

Extension cần các quyền sau:
- `activeTab`: Truy cập tab hiện tại
- `scripting`: Chạy script trên trang web  
- `tabs`: Quản lý tabs
- `storage`: Lưu trạng thái
- `alarms`: Đếm ngược thời gian
- `https://hoathinh3d.mx/*`: Truy cập website game

## 🆘 Troubleshooting

### Extension không hoạt động?
1. Kiểm tra extension đã được enable chưa
2. Refresh trang web và thử lại
3. Kiểm tra Console logs (F12)

### Không tìm thấy rương?
1. Đảm bảo đang ở trang Phúc Lợi Đường
2. Kiểm tra tên file ảnh rương có đúng format không
3. Thử refresh trang và chờ load hoàn toàn

### Countdown không chính xác?
1. Kiểm tra storage state: `chrome.storage.local.get(['phucLoiDuongState'])`
2. Clear storage nếu cần: `chrome.storage.local.clear()`

## 📝 Version History

### v1.0.0
- Tính năng cơ bản: Tự động mở rương Phúc Lợi Đường
- Chu trình 4 lần, mỗi lần 30 phút
- UI đếm ngược thời gian
- Khôi phục trạng thái sau khi đóng/mở

---

**Developed by**: GitHub Copilot  
**Game**: Hoạt Hình 3D (hoathinh3d.mx)  
**License**: MIT
