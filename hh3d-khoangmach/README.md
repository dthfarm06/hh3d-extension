# HH3D Khoáng Mạch Auto Extension

## 🏔️ Giới Thiệu

Extension tự động nhận thưởng khoáng mạch cho game HoatHinh3D. Extension hoạt động chỉ trên trang khoáng mạch và tự động thu thập thưởng mỗi 15 phút.

## ✨ Tính Năng

- ✅ **Tự động click "Làm mới"** trước khi nhận thưởng
- ✅ **Tự động nhận thưởng** mỗi 15 phút
- ✅ **Hoạt động ngầm** kể cả khi tab inactive  
- ✅ **Countdown timer** hiển thị thời gian còn lại
- ✅ **Persistent state** - Không mất tiến độ khi restart browser
- ✅ **Smart recovery** - Tự động phục hồi khi có lỗi
- ✅ **Enhanced error handling** - Xử lý lỗi kết nối tốt hơn
- ✅ **Auto content script injection** - Tự động inject script khi cần
- ✅ **Notification system** - Thông báo khi nhận thưởng
- ✅ **Popup UI** đơn giản để kiểm tra trạng thái

## 🚀 Cài Đặt

### Cách 1: Tải từ Chrome Web Store (Sắp có)
*Đang chuẩn bị submit lên Chrome Web Store*

### Cách 2: Cài đặt thủ công (Developer Mode)

1. **Tải extension:**
   - Tải file ZIP hoặc clone repository này
   - Giải nén vào một thư mục

2. **Bật Developer Mode:**
   - Mở Chrome và truy cập `chrome://extensions/`
   - Bật "Developer mode" ở góc trên bên phải

3. **Load extension:**
   - Click "Load unpacked"
   - Chọn thư mục chứa extension
   - Extension sẽ xuất hiện trong danh sách

4. **Kích hoạt:**
   - Đảm bảo extension được bật (toggle ON)
   - Icon 🏔️ sẽ xuất hiện trên thanh công cụ

## 📖 Hướng Dẫn Sử Dụng

### Bước 1: Truy cập trang khoáng mạch
```
https://hoathinh3d.mx/khoang-mach?t=ab487
```

### Bước 2: Extension tự động kích hoạt
- Extension sẽ tự động phát hiện trang khoáng mạch
- Badge trên icon sẽ chuyển thành "WAIT" (màu cam)
- Bắt đầu đếm ngược 15 phút

### Bước 3: Kiểm tra trạng thái
- Click vào icon extension để mở popup
- Xem countdown timer và thống kê
- Có thể dừng/bắt đầu bằng tay nếu cần

### Bước 4: Tự động nhận thưởng
- Khi đến giờ, extension sẽ tự động click nút nhận thưởng
- Badge chuyển thành "ON" (màu xanh) khi đang thu thập
- Sau khi thành công, lại bắt đầu chu kỳ mới

## 🎛️ Popup Interface

### Thông tin hiển thị:
- **Trạng thái:** Đang đào / Đang chờ / Đã dừng
- **Countdown:** Thời gian đếm ngược đến lần nhận tiếp theo
- **Lần cuối:** Thời gian nhận thưởng lần cuối
- **Tổng nhận:** Số lần đã nhận thưởng

### Điều khiển:
- **Bắt đầu/Dừng:** Toggle trạng thái đào
- **Cập nhật:** Refresh thông tin từ background
- **Mở trang khoáng mạch:** Shortcut đến trang đào

### Cài đặt:
- **Khoảng thời gian:** Thay đổi interval (mặc định 15 phút)
- **Tự động bắt đầu:** Auto-start khi vào trang
- **Thông báo:** Bật/tắt notifications
- **Âm thanh:** Sound alert khi nhận thưởng

## 🔧 Cấu Hình

### Cài đặt mặc định:
```javascript
{
  interval: 15,        // Phút giữa các lần nhận thưởng
  autoStart: true,     // Tự động bắt đầu khi vào trang
  notifications: true, // Hiển thị thông báo
  soundAlert: false    // Âm thanh cảnh báo
}
```

### Tùy chỉnh interval:
- Có thể thay đổi từ 1-60 phút
- Khuyến nghị giữ 15 phút (theo game rule)
- Cài đặt sẽ được lưu tự động

## 🔍 Badge Status

| Badge | Màu | Ý nghĩa |
|-------|-----|---------|
| `ON` | 🟢 Xanh | Đang thu thập thưởng |
| `WAIT` | 🟡 Cam | Đang chờ đến giờ nhận |
| `OFF` | 🔴 Đỏ | Extension tắt hoặc lỗi |
| *(trống)* | ⚪ Xám | Không ở trang khoáng mạch |

## 🚨 Xử Lý Lỗi

### Extension tự động xử lý:
- **Tab đóng:** Chờ tab mở lại
- **Mạng lỗi:** Retry với exponential backoff  
- **Không tìm thấy nút:** Re-scan DOM và fallback selectors
- **Browser restart:** Restore state từ storage

### Lỗi countdown hoàn thành nhưng không click:
1. **Kiểm tra console:**
   ```javascript
   // Mở F12 → Console, chạy lệnh:
   debugTriggerAlarm()
   ```

2. **Test manual các component:**
   ```javascript
   // Test tìm button refresh:
   testRefreshButton()
   
   // Test tìm reward button:
   testFindRewardButton()
   
   // Test toàn bộ flow:
   testRewardCollection()
   
   // Kiểm tra extension state:
   debugExtensionState()
   ```

3. **Force trigger reward collection:**
   ```javascript
   // Force trigger từ background:
   chrome.runtime.sendMessage({action: 'debug_trigger_reward'})
   ```

### Xử lý thủ công:
1. **Click "Cập nhật"** trong popup
2. **Refresh trang** khoáng mạch  
3. **Restart extension** (disable/enable)
4. **Check Console** để debug (F12)
5. **Manual test** bằng debug commands ở trên

## 🛡️ Bảo Mật & Quyền Riêng Tư

### Permissions cần thiết:
- `storage` - Lưu settings và state
- `alarms` - Tạo countdown timer
- `activeTab` - Tương tác với tab hiện tại
- `scripting` - Inject content script
- `notifications` - Hiển thị thông báo

### Dữ liệu được lưu:
- Settings cá nhân (local storage)
- Thống kê nhận thưởng (local storage)
- **KHÔNG** lưu thông tin đăng nhập
- **KHÔNG** gửi dữ liệu ra ngoài

## 🐛 Báo Lỗi & Góp Ý

### Cách báo lỗi:
1. Mở Chrome DevTools (F12)
2. Tab Console và tìm lỗi có prefix `🏔️`
3. Screenshot popup interface  
4. Ghi rõ bước tái hiện lỗi

### Thông tin cần cung cấp:
- Chrome version
- Extension version  
- URL trang khoáng mạch
- Console logs
- Screenshots

## 📋 Changelog

### v1.0.0 (Initial Release)
- ✅ Auto reward collection every 15 minutes
- ✅ Background operation support
- ✅ Persistent state management  
- ✅ Popup UI with countdown
- ✅ Settings panel
- ✅ Error recovery system
- ✅ Notification system

## 🔮 Roadmap

### v1.1.0 (Sắp có)
- [ ] Multiple character support
- [ ] Statistics dashboard
- [ ] Export/import settings
- [ ] Advanced scheduling

### v1.2.0 (Tương lai)
- [ ] Machine learning optimization
- [ ] Remote configuration
- [ ] Multi-server support
- [ ] Integration with other HH3D features

## 📞 Hỗ Trợ

- **Documentation:** Xem file này và comments trong code
- **Issues:** Tạo issue trên GitHub repository
- **Discussion:** Discord community (sắp có)

## � Changelog

### v1.0.1 - Latest
- ✅ **[FIX]** Sửa lỗi "Could not establish connection" 
- ✅ **[FEATURE]** Thêm bước click button "Làm mới" trước khi nhận thưởng
- ✅ **[IMPROVEMENT]** Cải thiện error handling và connection stability
- ✅ **[IMPROVEMENT]** Thêm auto content script injection
- ✅ **[IMPROVEMENT]** Enhanced tab verification và retry mechanisms
- ✅ **[DEBUG]** Thêm debug functions: `testRefreshButton()`

### v1.0.0 - Initial Release
- ✅ Tự động nhận thưởng khoáng mạch mỗi 15 phút
- ✅ Persistent state và smart recovery
- ✅ Notification system
- ✅ Popup UI

## �📄 License

MIT License - Xem file LICENSE để biết chi tiết.

---

**🏔️ HH3D Khoáng Mạch Auto Extension v1.0.1**  
*Tự động hóa việc đào khoáng một cách thông minh và hiệu quả*
