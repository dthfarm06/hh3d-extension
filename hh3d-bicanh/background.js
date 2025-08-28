// Background Service Worker - Manages extension state and notifications
class BackgroundManager {
  constructor() {
    this.gameState = null;
    this.lastNotificationTime = 0;
    this.activeTabs = new Set();
  }

  // Handle messages from content script and popup
  handleMessage(request, sender, sendResponse) {
    try {
      switch (request.type) {
        case 'STATE_UPDATE':
          this.updateGameState(request.state, sender.tab);
          sendResponse({ success: true });
          break;

        case 'AUTO_ACTION':
          this.handleAutoAction(request.action, sender.tab);
          sendResponse({ success: true });
          break;

        case 'CONTENT_SCRIPT_READY':
          this.handleContentScriptReady(request, sender.tab);
          sendResponse({ success: true });
          break;

        case 'GET_GAME_STATE':
          sendResponse(this.gameState);
          break;

        case 'POPUP_OPENED':
          this.handlePopupOpened();
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('[Boss Helper] Background message error:', error);
      sendResponse({ error: error.message });
    }

    return true; // Keep message channel open
  }

  // Handle content script ready notification
  handleContentScriptReady(request, tab) {
    console.log(`[Boss Helper] Content script ready on ${request.mode} mode: ${request.url}`);
    this.activeTabs.add(tab.id);
    
    // Remove tab from active set when closed
    chrome.tabs.onRemoved.addListener((tabId) => {
      this.activeTabs.delete(tabId);
    });
  }

  // Update game state and trigger notifications
  updateGameState(newState, tab) {
    const oldState = this.gameState;
    this.gameState = { ...newState, tabId: tab?.id };

    // Notify when ready to challenge (countdown -> ready)
    if (oldState?.status === 'countdown' && newState.status === 'ready') {
      this.notifyReadyToChallenge(tab);
    }

    // Notify when attacks depleted
    if (oldState?.attacksLeft > 0 && newState.attacksLeft === 0) {
      this.notifyAttacksDepleted(tab);
    }

    // Update badge
    this.updateBadge(newState);

    console.log(`[Boss Helper] State updated: ${newState.status}, Time: ${newState.timeLeft}s, Attacks: ${newState.attacksLeft}`);
  }

  // Handle auto action notifications
  handleAutoAction(action, tab) {
    const now = Date.now();
    
    switch (action) {
      case 'challenge':
        this.showNotification('🗡️ Auto Challenge', 'Đã tự động thách đấu boss!');
        break;
      case 'attack':
        this.showNotification('⚔️ Auto Attack', 'Đã tự động tấn công boss!');
        break;
    }
  }

  // Handle popup opened
  handlePopupOpened() {
    // Refresh state when popup opens
    this.refreshGameState();
  }

  // Show notification when ready to challenge
  notifyReadyToChallenge(tab) {
    const now = Date.now();
    if (now - this.lastNotificationTime < 30000) return; // Throttle notifications

    this.showNotification(
      '🐉 Boss Ready!', 
      `Sẵn sàng thách đấu ${this.gameState?.bossName || 'boss'}!`
    );

    this.lastNotificationTime = now;
  }

  // Show notification when attacks depleted
  notifyAttacksDepleted(tab) {
    this.showNotification(
      '⏰ Hết lượt đánh', 
      'Đã hết lượt đánh hôm nay. Vui lòng quay lại vào ngày mai!'
    );
  }

  // Generic notification helper
  showNotification(title, message) {
    chrome.storage.sync.get(['notificationsEnabled'], (result) => {
      if (result.notificationsEnabled !== false) { // Default to enabled
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: title,
          message: message
        });
      }
    });
  }

  // Update extension badge
  updateBadge(state) {
    let badgeText = '';
    let badgeColor = '#666';

    switch (state.status) {
      case 'countdown':
        if (state.timeLeft > 0) {
          const minutes = Math.ceil(state.timeLeft / 60);
          badgeText = minutes > 99 ? '99+' : minutes.toString();
          badgeColor = '#ffa500'; // Orange
        }
        break;
        
      case 'ready':
        badgeText = '!';
        badgeColor = '#00ff00'; // Green
        break;
        
      case 'depleted':
        badgeText = '0';
        badgeColor = '#ff0000'; // Red
        break;
        
      case 'unknown':
      default:
        badgeText = '?';
        badgeColor = '#666666'; // Gray
        break;
    }

    chrome.action.setBadgeText({ text: badgeText });
    chrome.action.setBadgeBackgroundColor({ color: badgeColor });

    // Update title with current state
    const titles = {
      'countdown': `Boss Helper - Còn ${Math.ceil(state.timeLeft / 60)} phút`,
      'ready': 'Boss Helper - Sẵn sàng!',
      'depleted': 'Boss Helper - Hết lượt',
      'unknown': 'Boss Helper'
    };
    
    chrome.action.setTitle({ 
      title: titles[state.status] || 'Boss Helper' 
    });
  }

  // Refresh game state from active tabs
  refreshGameState() {
    this.activeTabs.forEach(tabId => {
      chrome.tabs.sendMessage(tabId, { type: 'GET_STATE' })
        .then(response => {
          if (response) {
            this.updateGameState(response, { id: tabId });
          }
        })
        .catch(err => {
          console.log(`[Boss Helper] Failed to get state from tab ${tabId}:`, err);
          this.activeTabs.delete(tabId); // Remove inactive tab
        });
    });
  }

  // Periodic health check for active tabs
  performHealthCheck() {
    console.log(`[Boss Helper] Health check for ${this.activeTabs.size} active tabs`);
    
    const tabChecks = Array.from(this.activeTabs).map(tabId => {
      return chrome.tabs.sendMessage(tabId, { type: 'HEALTH_CHECK' })
        .then(response => ({ tabId, response }))
        .catch(err => ({ tabId, error: err }));
    });

    Promise.allSettled(tabChecks).then(results => {
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          const { tabId, response, error } = result.value;
          if (error) {
            console.log(`[Boss Helper] Tab ${tabId} not responsive, removing`);
            this.activeTabs.delete(tabId);
          }
        }
      });
    });
  }
}

// Initialize background manager
const backgroundManager = new BackgroundManager();

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  backgroundManager.handleMessage(request, sender, sendResponse);
});

// Set up periodic alarms
chrome.alarms.create('healthCheck', { periodInMinutes: 2 });
chrome.alarms.create('stateRefresh', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
  switch (alarm.name) {
    case 'healthCheck':
      backgroundManager.performHealthCheck();
      break;
      
    case 'stateRefresh':
      backgroundManager.refreshGameState();
      break;
  }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('[Boss Helper] Extension started');
  backgroundManager.updateBadge({ status: 'unknown', timeLeft: 0, attacksLeft: 0 });
});

// Handle extension install
chrome.runtime.onInstalled.addListener(() => {
  console.log('[Boss Helper] Extension installed');
  
  // Set default settings
  chrome.storage.sync.set({
    autoEnabled: true,
    notificationsEnabled: true,
    soundEnabled: false
  });
  
  backgroundManager.updateBadge({ status: 'unknown', timeLeft: 0, attacksLeft: 0 });
});

console.log('[Boss Helper] Background service worker loaded');
