# 🎯 HH3D Vấn Đáp Helper - Chrome Extension MV3

Extension Chrome Manifest V3 tự động hỗ trợ giải vấn đáp trên trang HoatHinh3D với khả năng phát hiện thông minh, auto-click và chế độ tự động hoàn toàn.

## ✨ Tính năng hoàn thiện

### 🔍 Phát hiện thông minh
- **Multi-strategy detection**: Sử dụng nhiều selector strategies để phát hiện câu hỏi
- **Shadow DOM support**: Traversal Shadow DOM để tìm câu hỏi ẩn
- **Fuzzy matching**: So sánh với accent stripping, word overlap scoring  
- **Resilient DOM monitoring**: Hoạt động với SPA navigation và DOM changes

### 🤖 Tự động hóa an toàn
- **Auto-click**: Tự động nhấn đáp án đúng với randomized delays
- **Auto mode**: Chế độ tự động hoàn toàn qua 5 câu hỏi
- **Smart safety**: Single click per question, rate limiting
- **Human-like behavior**: Realistic delays và interaction patterns

### 🎛️ Điều khiển linh hoạt
- **Real-time popup UI**: Interface trực quan với live status updates
- **Manual controls**: Click thủ công, refresh, restart, stop any time
- **Pin popup**: Ghim popup để không tự đóng khi auto-click
- **Persistent settings**: Auto-save pin state và preferences

### 📊 Monitoring & Diagnostics
- **Live status tracking**: Real-time question/answer/progress display
- **Available options display**: Hiển thị tất cả lựa chọn được detect
- **Comprehensive logging**: Multi-level logs với diagnostic info
- **Error resilience**: Graceful degradation với extensive error handling

## 🚀 Cài đặt

### 1. Load Extension vào Chrome

1. Mở Chrome và vào `chrome://extensions/`
2. Bật **Developer mode** (toggle góc phải trên)
3. Click **Load unpacked**
4. Chọn thư mục `hh3d-vandap`
5. Extension sẽ xuất hiện với icon 🎯

### 2. Cách sử dụng

#### 🌐 **Production Mode**
1. Vào trang: `https://hoathinh3d.mx/van-dap-tong-mon?t=xxxxx`
2. Popup sẽ **tự động hiện** khi vào trang
3. Nhấn nút **"BẮT ĐẦU VẤN ĐÁP"** trên website
4. Extension sẽ tự động:
   - Phát hiện câu hỏi
   - Tìm đáp án
   - Hiển thị trong popup
   - Tự động click (nếu bật)

#### 🧪 **Test Mode**  
1. Mở file `test-vandap.html` trong thư mục extension
2. Extension sẽ tự động phát hiện môi trường test
3. Test với câu hỏi mẫu có sẵn

#### 🚀 **Chế độ Tự động Hoàn toàn**
1. **Bật "Chế độ tự động hoàn toàn"** trong popup
2. Extension sẽ tự động:
   - Phát hiện câu hỏi mới
   - Tìm đáp án từ database
   - Click đáp án đúng
   - Chờ câu hỏi tiếp theo
   - Lặp lại cho đến hết 5 câu
3. **Dừng bất cứ lúc nào** bằng nút "Dừng Auto"
4. **Khởi động lại** quiz bằng nút "Khởi động lại"

## 🎮 Giao diện Popup

### 📊 **Status Section**
- ✅ **URL Status**: Kiểm tra đúng trang vấn đáp
- ⏳ **Question Status**: Trạng thái phát hiện câu hỏi

### 📝 **Question & Answer**
- **Câu hỏi hiện tại**: Hiển thị câu hỏi đang được phát hiện
- **Đáp án**: Hiển thị đáp án tìm được
- 🎯 **Nút "Nhấn đáp án"**: Click thủ công

### ⚙️ **Controls**
- 🤖 **Toggle "Tự động nhấn đáp án"**: Bật/tắt auto-click
- 🚀 **Toggle "Chế độ tự động hoàn toàn"**: Bật chế độ tự động hoàn toàn
- 📊 **Tiến độ**: Hiển thị x/5 câu hỏi
- 🔄 **Nút "Làm mới"**: Refresh detection
- ⏹️ **Nút "Dừng Auto"**: Dừng tất cả hoạt động tự động
- 🔄 **Nút "Khởi động lại"**: Reset quiz từ đầu

### 📋 **Available Options**
- Hiển thị các lựa chọn có sẵn trên trang
- Giúp debug khi không tìm thấy đáp án

### 📝 **Nhật ký**
- Ghi lại tất cả hoạt động
- Timestamp chi tiết
- Scroll để xem lịch sử

## 🔧 Cấu trúc Files

```
hh3d-vandap/
├── manifest.json          # Extension config
├── content.js             # Main logic + 203 questions DB
├── popup.html             # Popup UI
├── popup.js               # Popup logic  
├── styles.css             # Popup styling
├── background.js          # Background worker
├── build.bat              # Build script
├── test-vandap.html       # Test file
├── README.md              # This file
└── images/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## ⚡ Cách hoạt động

### 🔍 **Detection Logic**

1. **URL Detection**: 
   - PROD: `hoathinh3d.mx/van-dap-tong-mon*`
   - TEST: `*mock-vandap.html*`

2. **Question Detection**:
   - Selector: `#question` (primary)
   - Fallback selectors cho production
   - DOM mutation monitoring

3. **Answer Matching**:
   - Exact text match trước
   - Partial text match sau
   - Fuzzy string comparison

4. **Auto-click**:
   - Tìm button có text match với đáp án
   - Multiple selector strategies
   - Safety delays

### 🔄 **Real-time Updates**

- **MutationObserver** theo dõi DOM changes
- **Interval updates** popup mỗi 2s  
- **Message passing** giữa content ↔ popup
- **State synchronization** real-time

## 🐛 Debug & Troubleshooting

### 📋 **Check Console Logs**

```javascript
// Mở Dev Tools (F12) và xem:
[VanDap Helper] Initialized in TEST/PROD mode
[VanDap Helper] URL: current_url
[VanDap Helper] New question detected: question_text
[VanDap Helper] Found answer: answer_text
```

### ❌ **Common Issues**

1. **Popup không hiện**:
   - Kiểm tra URL có đúng pattern không
   - Xem background script logs
   - Thử click icon extension thủ công

2. **Không phát hiện câu hỏi**:
   - Kiểm tra DOM structure website
   - Xem selector có đúng không
   - Test với file mock trước

3. **Không tìm thấy đáp án**:
   - Kiểm tra text câu hỏi có chính xác không
   - Xem trong Available Options section
   - Database có 203 câu, có thể thiếu câu mới

4. **Auto-click không hoạt động**:
   - Kiểm tra selector options
   - Đáp án có match với option text không
   - Thử click thủ công bằng nút popup

### 🔧 **Manual Testing**

```bash
# Chạy build script
cd hh3d-vandap
build.bat

# Test với file local
# Mở test-vandap.html trong browser
```

## 📊 Database

Extension có sẵn **203 câu hỏi và đáp án** về:
- Tiên Nghịch, Đấu Phá Thương Khung
- Phàm Nhân Tu Tiên, Nhất Niệm Vĩnh Hằng  
- Các anime/phim hoạt hình Trung Quốc khác
- Tự động cập nhật khi có câu hỏi mới

## ⚠️ Lưu ý

- Extension chỉ hoạt động trên domain `hoathinh3d.mx`
- Cần bật Developer Mode để load extension
- Test kỹ trước khi sử dụng thực tế
- Không abuse, chỉ dùng để học tập

## 🔄 Updates

- v1.0: Initial release với 203 questions
- Có thể thêm câu hỏi mới vào `questionData` array
- Support cả TEST và PROD environment

---

**Made with ❤️ for HH3D Community**
