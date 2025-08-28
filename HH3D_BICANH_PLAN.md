# Chrome Extension - Bí Cảnh Tông Môn Auto Boss Helper

## 📋 Tổng quan dự án

Extension Chrome hỗ trợ tự động đánh boss trong game Bí Cảnh Tông Môn, cho phép người chơi theo dõi trạng thái và tự động thực hiện các hành động mà không cần mở tab game liên tục.

## 🎯 Mục tiêu chính

- **Monitoring**: Theo dõi trạng thái boss battle real-time
- **Automation**: Tự động click "Khiêu Chiến" khi sẵn sàng
- **Background**: Hoạt động ngầm không cần tab active
- **User-friendly**: Giao diện đơn giản, dễ sử dụng

## 🔧 Tính năng chi tiết

### 1. **Popup Interface** 
```
┌─────────────────────────────────┐
│ 🐉 Bí Cảnh Tông Môn Helper      │
├─────────────────────────────────┤
│ Trạng thái: [Đang đếm ngược]    │
│ Thời gian: [05:32]              │
│ Lượt đánh: [3/5]                │
├─────────────────────────────────┤
│ ☑️ Tự động đánh boss            │
│ ☑️ Thông báo khi sẵn sàng       │
│ ☑️ Âm thanh cảnh báo            │
├─────────────────────────────────┤
│ [Bật/Tắt Extension]             │
└─────────────────────────────────┘
```

### 2. **Status Monitoring**
- **Countdown Status**: "Đang đếm ngược" / "Sẵn sàng đánh" / "Hết lượt"
- **Timer Display**: Hiển thị thời gian còn lại (MM:SS)
- **Attack Count**: Số lượt đánh còn lại (X/5)
- **Boss Info**: Tên boss, cấp độ, HP

### 3. **Auto Actions**
- **Auto Challenge**: Tự động click "Khiêu Chiến" khi countdown = 0
- **Auto Attack**: Tự động click "Tấn Công" trong popup battle
- **Smart Timing**: Đợi DOM load và kiểm tra element tồn tại

### 4. **Background Operations**
- **Content Script**: Inject vào trang game để monitor
- **Service Worker**: Chạy ngầm và quản lý state
- **Tab Management**: Hoạt động kể cả khi tab inactive

## 🏗️ Kiến trúc Extension

### **1. Manifest.json**
```json
{
  "manifest_version": 3,
  "name": "Bí Cảnh Tông Môn Auto Boss Helper",
  "version": "1.0",
  "description": "Tự động hỗ trợ đánh boss trong game Bí Cảnh Tông Môn",
  "permissions": [
    "activeTab",
    "storage",
    "notifications",
    "alarms"
  ],
  "host_permissions": [
    "https://your-game-domain.com/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [{
    "matches": ["https://your-game-domain.com/*"],
    "js": ["content.js"],
    "run_at": "document_end"
  }],
  "action": {
    "default_popup": "popup.html",
    "default_title": "Boss Helper"
  }
}
```

### **2. File Structure**
```
boss-helper-extension/
├── manifest.json
├── popup.html          # Giao diện popup
├── popup.js            # Logic popup
├── popup.css           # Style popup
├── content.js          # Script inject vào game
├── background.js       # Service worker
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── sounds/
    └── notification.mp3
```

## 📝 Chi tiết implementation

### **1. Content Script (content.js)**
```javascript
// Monitoring game state
class BossMonitor {
  constructor() {
    this.isEnabled = false;
    this.gameState = {
      status: 'unknown',
      timeLeft: 0,
      attacksLeft: 5,
      canChallenge: false
    };
  }

  // Detect game elements
  detectGameElements() {
    return {
      challengeBtn: document.getElementById('challenge-boss-btn'),
      attackBtn: document.getElementById('attack-boss-btn'),
      attackCount: document.querySelector('.attack-count'),
      bossPopup: document.getElementById('boss-damage-screen')
    };
  }

  // Parse countdown timer
  parseCountdown(timerText) {
    const match = timerText.match(/(\d+):(\d+)/);
    if (match) {
      return parseInt(match[1]) * 60 + parseInt(match[2]);
    }
    return 0;
  }

  // Monitor game state changes
  monitorGameState() {
    const elements = this.detectGameElements();
    
    if (elements.challengeBtn) {
      const btnText = elements.challengeBtn.textContent.trim();
      
      if (btnText.includes('Còn')) {
        // Countdown state
        this.gameState.status = 'countdown';
        this.gameState.timeLeft = this.parseCountdown(btnText);
        this.gameState.canChallenge = false;
      } else if (btnText.includes('KHIÊU CHIẾN')) {
        // Ready to challenge
        this.gameState.status = 'ready';
        this.gameState.timeLeft = 0;
        this.gameState.canChallenge = true;
      } else if (btnText.includes('Hết Lượt')) {
        // No attacks left
        this.gameState.status = 'depleted';
        this.gameState.canChallenge = false;
      }
    }

    // Update attacks left
    if (elements.attackCount) {
      this.gameState.attacksLeft = parseInt(elements.attackCount.textContent);
    }

    // Send state to background
    chrome.runtime.sendMessage({
      type: 'STATE_UPDATE',
      state: this.gameState
    });
  }

  // Auto challenge when ready
  autoChallenge() {
    if (!this.isEnabled || !this.gameState.canChallenge) return;

    const elements = this.detectGameElements();
    if (elements.challengeBtn && !elements.challengeBtn.disabled) {
      elements.challengeBtn.click();
      
      // Wait for popup then auto attack
      setTimeout(() => this.autoAttack(), 1000);
    }
  }

  // Auto attack in popup
  autoAttack() {
    const elements = this.detectGameElements();
    if (elements.attackBtn && elements.bossPopup.classList.contains('show')) {
      elements.attackBtn.click();
    }
  }

  // Start monitoring
  start() {
    this.isEnabled = true;
    
    // Monitor every second
    setInterval(() => {
      this.monitorGameState();
      if (this.isEnabled) {
        this.autoChallenge();
      }
    }, 1000);
  }

  // Stop monitoring
  stop() {
    this.isEnabled = false;
  }
}

// Initialize monitor
const bossMonitor = new BossMonitor();

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case 'START_MONITORING':
      bossMonitor.start();
      break;
    case 'STOP_MONITORING':
      bossMonitor.stop();
      break;
    case 'GET_STATE':
      sendResponse(bossMonitor.gameState);
      break;
  }
});

// Auto start if enabled
chrome.storage.sync.get(['autoEnabled'], (result) => {
  if (result.autoEnabled) {
    bossMonitor.start();
  }
});
```

### **2. Background Service Worker (background.js)**
```javascript
// Manage extension state and notifications
class BackgroundManager {
  constructor() {
    this.gameState = null;
    this.lastNotificationTime = 0;
  }

  // Handle messages from content script
  handleMessage(request, sender, sendResponse) {
    switch (request.type) {
      case 'STATE_UPDATE':
        this.updateGameState(request.state, sender.tab);
        break;
    }
  }

  // Update game state and trigger notifications
  updateGameState(newState, tab) {
    const oldState = this.gameState;
    this.gameState = newState;

    // Notify when ready to challenge
    if (oldState?.status === 'countdown' && newState.status === 'ready') {
      this.notifyReadyToChallenge(tab);
    }

    // Update badge
    this.updateBadge(newState);
  }

  // Show notification when ready
  notifyReadyToChallenge(tab) {
    const now = Date.now();
    if (now - this.lastNotificationTime < 30000) return; // Throttle

    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Boss Helper',
      message: 'Sẵn sàng thách đấu boss!'
    });

    this.lastNotificationTime = now;
  }

  // Update extension badge
  updateBadge(state) {
    let badgeText = '';
    let badgeColor = '#666';

    switch (state.status) {
      case 'countdown':
        badgeText = Math.ceil(state.timeLeft / 60).toString();
        badgeColor = '#ffa500';
        break;
      case 'ready':
        badgeText = '!';
        badgeColor = '#00ff00';
        break;
      case 'depleted':
        badgeText = '0';
        badgeColor = '#ff0000';
        break;
    }

    chrome.action.setBadgeText({ text: badgeText });
    chrome.action.setBadgeBackgroundColor({ color: badgeColor });
  }
}

const backgroundManager = new BackgroundManager();

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  backgroundManager.handleMessage(request, sender, sendResponse);
});

// Alarm for periodic checks
chrome.alarms.create('checkBoss', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkBoss') {
    // Periodic health check
    chrome.tabs.query({ url: 'https://your-game-domain.com/*' }, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { type: 'HEALTH_CHECK' });
      });
    });
  }
});
```

### **3. Popup Interface (popup.html + popup.js)**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div class="container">
    <h2>🐉 Boss Helper</h2>
    
    <div class="status-section">
      <div class="status-item">
        <span class="label">Trạng thái:</span>
        <span id="status" class="value">Đang tải...</span>
      </div>
      <div class="status-item">
        <span class="label">Thời gian:</span>
        <span id="timer" class="value">--:--</span>
      </div>
      <div class="status-item">
        <span class="label">Lượt đánh:</span>
        <span id="attacks" class="value">-/5</span>
      </div>
    </div>

    <div class="settings-section">
      <label class="checkbox-label">
        <input type="checkbox" id="autoEnabled">
        <span>Tự động đánh boss</span>
      </label>
      <label class="checkbox-label">
        <input type="checkbox" id="notificationsEnabled">
        <span>Thông báo khi sẵn sàng</span>
      </label>
      <label class="checkbox-label">
        <input type="checkbox" id="soundEnabled">
        <span>Âm thanh cảnh báo</span>
      </label>
    </div>

    <div class="actions-section">
      <button id="refreshBtn" class="btn secondary">🔄 Làm mới</button>
      <button id="toggleBtn" class="btn primary">Bật Extension</button>
    </div>
  </div>

  <script src="popup.js"></script>
</body>
</html>
```

## 🚀 Triển khai và Test

### **Phase 1: Core Development**
1. ✅ Tạo basic extension structure
2. ✅ Implement content script monitoring
3. ✅ Tạo popup interface
4. ✅ Basic auto-click functionality

### **Phase 2: Advanced Features**
1. ✅ Background service worker
2. ✅ Notifications system
3. ✅ Settings persistence
4. ✅ Error handling

### **Phase 3: Polish & Optimization**
1. ✅ UI/UX improvements
2. ✅ Performance optimization
3. ✅ Comprehensive testing
4. ✅ Documentation

### **Testing Strategy**
- **Manual Testing**: Test trên game thật
- **Edge Cases**: Mất mạng, tab đóng, game update
- **Performance**: Monitor memory usage, CPU
- **Compatibility**: Test trên Chrome/Edge versions

## 🔒 Bảo mật và Tuân thủ

### **Chrome Web Store Policies**
- ✅ Không vi phạm ToS của game
- ✅ Chỉ automation cơ bản, không hack
- ✅ Transparent về tính năng
- ✅ Respect user privacy

### **Game Compliance**
- ✅ Không modify game code
- ✅ Chỉ simulate user clicks
- ✅ Không bypass game mechanics
- ✅ Fair play principles

## 📊 Metrics và Analytics

### **Success Metrics**
- User adoption rate
- Daily active users
- Feature usage statistics
- User satisfaction scores

### **Technical Metrics**
- Extension performance
- Error rates
- Crash reports
- Memory usage

## 🎯 Future Enhancements

### **Version 2.0 Ideas**
- **Multi-boss support**: Hỗ trợ nhiều loại boss
- **Schedule attacks**: Đặt lịch tấn công
- **Team coordination**: Phối hợp với guild members
- **Advanced analytics**: Stats chi tiết

### **Integration Possibilities**
- **Discord bot**: Notify qua Discord
- **Mobile companion**: App mobile
- **Web dashboard**: Quản lý từ web

---

## 📝 Notes

Đây là một plan chi tiết để phát triển Chrome Extension hỗ trợ auto boss. Extension sẽ:

1. **Monitor real-time** trạng thái game từ DOM
2. **Auto-click** khi sẵn sàng thách đấu
3. **Background operation** không cần tab active
4. **User-friendly interface** dễ sử dụng
5. **Comply** với chính sách Chrome và game

Extension này sẽ giúp người chơi tối ưu hóa thời gian và không bỏ lỡ cơ hội đánh boss!
