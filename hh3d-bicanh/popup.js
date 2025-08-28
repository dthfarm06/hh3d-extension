// Popup JavaScript - Handles UI interactions and state display
class PopupController {
  constructor() {
    this.gameState = null;
    this.isAutoEnabled = false;
    this.refreshInterval = null;
    this.unresponsiveTabs = new Set(); // Track tabs that don't respond
    this.lastRefreshTime = 0;
    this.refreshThrottle = 1000; // Minimum time between refreshes
    
    this.initializeElements();
    this.loadSettings();
    this.setupEventListeners();
    this.startAutoRefresh();
    
    // Notify background that popup opened
    chrome.runtime.sendMessage({ type: 'POPUP_OPENED' });
  }

  // Check if URL matches game page (with support for query parameters)
  isGameUrl(url) {
    return url.includes('hoathinh3d.mx/bi-canh-tong-mon') || 
           url.includes('mock-bicanh.html');
  }

  // Get game tabs using more flexible matching
  async getGameTabs() {
    // First try the standard URL patterns
    let tabs = await chrome.tabs.query({ 
      url: [
        'https://hoathinh3d.mx/bi-canh-tong-mon*',
        'file://*/*mock-bicanh.html*'
      ]
    });

    // If no tabs found, try broader search
    if (tabs.length === 0) {
      const allTabs = await chrome.tabs.query({});
      tabs = allTabs.filter(tab => this.isGameUrl(tab.url));
    }

    return tabs;
  }

  // Initialize DOM elements
  initializeElements() {
    this.elements = {
      status: document.getElementById('status'),
      timer: document.getElementById('timer'),
      attacks: document.getElementById('attacks'),
      bossName: document.getElementById('boss-name'),
      mode: document.getElementById('mode'),
      lastUpdate: document.getElementById('last-update'),
      
      autoEnabled: document.getElementById('autoEnabled'),
      notificationsEnabled: document.getElementById('notificationsEnabled'),
      soundEnabled: document.getElementById('soundEnabled'),
      
      refreshBtn: document.getElementById('refreshBtn'),
      toggleBtn: document.getElementById('toggleBtn'),
      toggleText: document.getElementById('toggleText')
    };
  }

  // Load settings from storage
  async loadSettings() {
    try {
      const settings = await chrome.storage.sync.get([
        'autoEnabled',
        'notificationsEnabled', 
        'soundEnabled'
      ]);

      this.elements.autoEnabled.checked = settings.autoEnabled !== false; // Default true
      this.elements.notificationsEnabled.checked = settings.notificationsEnabled !== false; // Default true
      this.elements.soundEnabled.checked = settings.soundEnabled === true; // Default false

      this.isAutoEnabled = this.elements.autoEnabled.checked;
      this.updateToggleButton();
      
    } catch (error) {
      console.error('[Boss Helper] Failed to load settings:', error);
    }
  }

  // Setup event listeners
  setupEventListeners() {
    // Settings checkboxes
    this.elements.autoEnabled.addEventListener('change', () => {
      this.isAutoEnabled = this.elements.autoEnabled.checked;
      this.saveSetting('autoEnabled', this.isAutoEnabled);
      this.updateToggleButton();
      this.toggleMonitoring();
    });

    this.elements.notificationsEnabled.addEventListener('change', () => {
      this.saveSetting('notificationsEnabled', this.elements.notificationsEnabled.checked);
    });

    this.elements.soundEnabled.addEventListener('change', () => {
      this.saveSetting('soundEnabled', this.elements.soundEnabled.checked);
    });

    // Action buttons
    this.elements.refreshBtn.addEventListener('click', () => {
      this.refreshState();
    });

    this.elements.toggleBtn.addEventListener('click', () => {
      this.isAutoEnabled = !this.isAutoEnabled;
      this.elements.autoEnabled.checked = this.isAutoEnabled;
      this.saveSetting('autoEnabled', this.isAutoEnabled);
      this.updateToggleButton();
      this.toggleMonitoring();
    });
  }

  // Save setting to storage
  async saveSetting(key, value) {
    try {
      await chrome.storage.sync.set({ [key]: value });
    } catch (error) {
      console.error(`[Boss Helper] Failed to save ${key}:`, error);
    }
  }

  // Update toggle button appearance
  updateToggleButton() {
    if (this.isAutoEnabled) {
      this.elements.toggleBtn.classList.add('active');
      this.elements.toggleText.textContent = 'Tắt Extension';
      this.elements.toggleBtn.querySelector('.icon').textContent = '⚡';
    } else {
      this.elements.toggleBtn.classList.remove('active');
      this.elements.toggleText.textContent = 'Bật Extension';
      this.elements.toggleBtn.querySelector('.icon').textContent = '⭕';
    }
  }

  // Toggle monitoring on/off
  async toggleMonitoring() {
    try {
      const tabs = await this.getGameTabs();

      if (tabs.length === 0) {
        this.showError('Không tìm thấy tab game đang mở');
        return;
      }

      const messageType = this.isAutoEnabled ? 'START_MONITORING' : 'STOP_MONITORING';
      let successCount = 0;
      
      for (const tab of tabs) {
        // Skip tabs we know are unresponsive
        if (this.unresponsiveTabs.has(tab.id)) {
          continue;
        }

        try {
          await chrome.tabs.sendMessage(tab.id, { type: messageType });
          successCount++;
          console.log(`[Boss Helper] ${messageType} sent to tab ${tab.id}: ${tab.url}`);
        } catch (error) {
          console.log(`[Boss Helper] Failed to toggle monitoring for tab ${tab.id}:`, error);
          this.unresponsiveTabs.add(tab.id);
          
          // Clean up unresponsive tabs after 30 seconds
          setTimeout(() => {
            this.unresponsiveTabs.delete(tab.id);
          }, 30000);
        }
      }

      if (successCount === 0) {
        this.showError('Không thể kết nối với tab game');
      } else {
        // Force refresh after toggle
        setTimeout(() => {
          this.lastRefreshTime = 0; // Reset throttle
          this.refreshState();
        }, 500);
      }
      
    } catch (error) {
      console.error('[Boss Helper] Failed to toggle monitoring:', error);
      this.showError('Lỗi khi bật/tắt extension');
    }
  }

  // Refresh game state
  async refreshState() {
    try {
      // Throttle refresh calls
      const now = Date.now();
      if (now - this.lastRefreshTime < this.refreshThrottle) {
        return;
      }
      this.lastRefreshTime = now;

      // Show loading
      this.elements.status.textContent = 'Đang tải...';
      this.elements.status.className = 'value loading';

      // Get state from background first
      const gameState = await chrome.runtime.sendMessage({ type: 'GET_GAME_STATE' });
      
      if (gameState && gameState.lastUpdate && (now - gameState.lastUpdate < 10000)) {
        // Use background state if it's recent (less than 10 seconds old)
        this.updateDisplay(gameState);
        return;
      }

      // Try to get fresh state from active tabs
      const tabs = await this.getGameTabs();

      if (tabs.length === 0) {
        this.showNoConnection();
        return;
      }

      let stateFound = false;
      for (const tab of tabs) {
        // Skip tabs we know are unresponsive
        if (this.unresponsiveTabs.has(tab.id)) {
          continue;
        }

        try {
          const state = await chrome.tabs.sendMessage(tab.id, { type: 'GET_STATE' });
          if (state) {
            this.updateDisplay(state);
            stateFound = true;
            break;
          }
        } catch (error) {
          // Mark tab as unresponsive and remove it after some time
          console.log(`[Boss Helper] Tab ${tab.id} not responsive, marking as unresponsive`);
          this.unresponsiveTabs.add(tab.id);
          
          // Clean up unresponsive tabs after 30 seconds
          setTimeout(() => {
            this.unresponsiveTabs.delete(tab.id);
          }, 30000);
        }
      }

      if (!stateFound) {
        this.showNoConnection();
      }
      
    } catch (error) {
      console.error('[Boss Helper] Failed to refresh state:', error);
      this.showError('Lỗi khi tải trạng thái');
    }
  }

  // Update display with game state
  updateDisplay(gameState) {
    this.gameState = gameState;

    // Update status
    const statusText = this.getStatusText(gameState.status);
    this.elements.status.textContent = statusText;
    this.elements.status.className = `value ${gameState.status}`;

    // Update timer
    if (gameState.status === 'countdown' && gameState.timeLeft > 0) {
      const minutes = Math.floor(gameState.timeLeft / 60);
      const seconds = gameState.timeLeft % 60;
      this.elements.timer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    } else {
      this.elements.timer.textContent = '--:--';
    }

    // Update attacks
    this.elements.attacks.textContent = `${gameState.attacksLeft}/5`;

    // Update boss name
    this.elements.bossName.textContent = gameState.bossName || 'Không xác định';

    // Update mode indicator
    this.updateModeIndicator();

    // Update last update time
    const now = new Date();
    this.elements.lastUpdate.textContent = now.toLocaleTimeString('vi-VN');
  }

  // Get status text for display
  getStatusText(status) {
    const statusMap = {
      'countdown': 'Đang đếm ngược',
      'ready': 'Sẵn sàng đánh!',
      'depleted': 'Hết lượt đánh',
      'unknown': 'Không xác định'
    };
    return statusMap[status] || 'Không xác định';
  }

  // Update mode indicator
  async updateModeIndicator() {
    try {
      const tabs = await this.getGameTabs();

      if (tabs.length > 0) {
        const isTestMode = tabs[0].url.includes('file:') || tabs[0].url.includes('mock-bicanh.html');
        const mode = isTestMode ? 'TEST' : 'PROD';
        
        this.elements.mode.textContent = mode;
        this.elements.mode.className = mode.toLowerCase();
        
        console.log(`[Boss Helper] Detected mode: ${mode}, URL: ${tabs[0].url}`);
      } else {
        this.elements.mode.textContent = 'NO TAB';
        this.elements.mode.className = 'unknown';
      }
    } catch (error) {
      this.elements.mode.textContent = 'ERROR';
      this.elements.mode.className = 'unknown';
    }
  }

  // Show no connection state
  showNoConnection() {
    this.elements.status.textContent = 'Chưa kết nối';
    this.elements.status.className = 'value unknown';
    this.elements.timer.textContent = '--:--';
    this.elements.attacks.textContent = '-/5';
    this.elements.bossName.textContent = 'Vui lòng mở tab game';
  }

  // Show error state
  showError(message) {
    this.elements.status.textContent = message;
    this.elements.status.className = 'value unknown';
  }

  // Start auto refresh
  startAutoRefresh() {
    // Initial refresh
    this.refreshState();
    
    // Refresh every 3 seconds (increased from 2 seconds)
    this.refreshInterval = setInterval(() => {
      this.refreshState();
    }, 3000);
  }

  // Stop auto refresh
  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});

// Clean up when popup closes
window.addEventListener('beforeunload', () => {
  if (window.popupController) {
    window.popupController.stopAutoRefresh();
  }
});
