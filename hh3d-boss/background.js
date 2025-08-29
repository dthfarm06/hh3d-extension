// Background Service Worker - Manages extension state and notifications
class BackgroundManager {
  constructor() {
    this.gameState = null;
    this.lastNotificationTime = 0;
    this.activeTabs = new Set();
    this.targetUrlPattern = /^https:\/\/hoathinh3d\.mx\/hoang-vuc\?t=\d+/;
    
    // Set up tab listeners
    this.setupTabListeners();
  }

  // Set up tab listeners for auto-detection
  setupTabListeners() {
    // Listen for tab updates (URL changes, page loads)
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdate(tabId, changeInfo, tab);
    });

    // Listen for new tabs
    chrome.tabs.onCreated.addListener((tab) => {
      this.handleTabCreated(tab);
    });

    // Listen for tab activation (user switches to tab)
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.handleTabActivated(activeInfo);
    });

    console.log('[Boss Helper] Tab listeners initialized');
  }

  // Handle tab updates (URL changes, page loads)
  handleTabUpdate(tabId, changeInfo, tab) {
    // Only process when URL changes or page completes loading
    if (changeInfo.url || changeInfo.status === 'complete') {
      const url = changeInfo.url || tab.url;
      
      if (url && this.isTargetUrl(url)) {
        console.log(`[Boss Helper] Target URL detected in tab ${tabId}: ${url}`);
        this.handleTargetUrlDetected(tabId, tab, url);
      }
    }
  }

  // Handle new tab creation
  handleTabCreated(tab) {
    if (tab.url && this.isTargetUrl(tab.url)) {
      console.log(`[Boss Helper] Target URL detected in new tab ${tab.id}: ${tab.url}`);
      this.handleTargetUrlDetected(tab.id, tab, tab.url);
    }
  }

  // Handle tab activation
  handleTabActivated(activeInfo) {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
      if (chrome.runtime.lastError) {
        console.log('[Boss Helper] Error getting active tab:', chrome.runtime.lastError.message);
        return;
      }
      
      if (tab.url && this.isTargetUrl(tab.url)) {
        console.log(`[Boss Helper] Target URL activated in tab ${tab.id}: ${tab.url}`);
        this.handleTargetUrlDetected(tab.id, tab, tab.url);
      }
    });
  }

  // Check if URL matches target pattern
  isTargetUrl(url) {
    const isMatch = this.targetUrlPattern.test(url);
    if (isMatch) {
      console.log(`[Boss Helper] URL pattern match: ${url}`);
    }
    return isMatch;
  }

  // Handle when target URL is detected
  handleTargetUrlDetected(tabId, tab, url) {
    // Add to active tabs
    this.activeTabs.add(tabId);
    
    // Show notification
    this.showNotification(
      '🎮 Hoang Vực Detected!', 
      `Extension đã phát hiện game và tự động kích hoạt!\nURL: ${url}`
    );

    // Send activation message to content script (with retry)
    this.activateContentScript(tabId, url);

    // Update badge to show active state
    chrome.action.setBadgeText({ text: '🎮', tabId: tabId });
    chrome.action.setBadgeBackgroundColor({ color: '#00ff00', tabId: tabId });
    chrome.action.setTitle({ 
      title: 'Boss Helper - Đã kích hoạt tự động!',
      tabId: tabId 
    });

    console.log(`[Boss Helper] Extension activated for tab ${tabId}: ${url}`);
  }

  // Activate content script with retry mechanism
  activateContentScript(tabId, url, retryCount = 0) {
    const maxRetries = 5;
    const retryDelay = 1000; // 1 second

    // Wait a bit for content script to load
    setTimeout(() => {
      chrome.tabs.sendMessage(tabId, { 
        type: 'AUTO_ACTIVATE',
        url: url,
        timestamp: Date.now()
      }).then(response => {
        if (response && response.success) {
          console.log(`[Boss Helper] Content script activated successfully in tab ${tabId}`);
        } else {
          console.log(`[Boss Helper] Content script activation failed for tab ${tabId}, response:`, response);
        }
      }).catch(error => {
        console.log(`[Boss Helper] Failed to activate content script in tab ${tabId} (attempt ${retryCount + 1}):`, error.message);
        
        // Retry if we haven't exceeded max retries
        if (retryCount < maxRetries) {
          setTimeout(() => {
            this.activateContentScript(tabId, url, retryCount + 1);
          }, retryDelay * (retryCount + 1)); // Exponential backoff
        } else {
          console.error(`[Boss Helper] Failed to activate content script after ${maxRetries} attempts`);
        }
      });
    }, 500); // Initial delay to let content script load
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
          this.handleAutoAction(request.action, sender.tab, request);
          sendResponse({ success: true });
          break;

        case 'CONTENT_SCRIPT_READY':
          this.handleContentScriptReady(request, sender.tab);
          sendResponse({ success: true });
          break;

        case 'AUTO_ACTIVATE':
          this.handleAutoActivateRequest(request, sender.tab);
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
    
    // Check if this is a target URL and auto-activate if needed
    if (this.isTargetUrl(request.url)) {
      console.log(`[Boss Helper] Auto-activating for target URL: ${request.url}`);
      // Send auto-activate message to content script
      setTimeout(() => {
        chrome.tabs.sendMessage(tab.id, { 
          type: 'AUTO_ACTIVATE',
          url: request.url,
          timestamp: Date.now()
        });
      }, 1000);
    }
    
    // Remove tab from active set when closed
    chrome.tabs.onRemoved.addListener((tabId) => {
      this.activeTabs.delete(tabId);
    });
  }

  // Handle auto-activate request from content script
  handleAutoActivateRequest(request, tab) {
    console.log(`[Boss Helper] Auto-activate request from tab ${tab.id}: ${request.url}`);
    this.handleTargetUrlDetected(tab.id, tab, request.url);
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
  handleAutoAction(action, tab, request = {}) {
    const now = Date.now();
    
    switch (action) {
      case 'challenge':
        this.showNotification('🗡️ Auto Challenge', 'Đã tự động thách đấu boss!');
        break;
      case 'attack':
        this.showNotification('⚔️ Auto Attack', 'Đã tự động tấn công boss!');
        break;
      case 'back':
        this.showNotification('↩️ Auto Back', 'Đã tự động trở lại!');
        break;
      case 'countdown_start':
        const attackNumber = request.attackNumber || 1;
        const attacksLeft = request.attacksLeft || 0;
        this.showNotification('⏰ Countdown Started', 
          `Đã hoàn thành lượt ${attackNumber}/5. Đếm ngược 20 phút (còn ${attacksLeft} lượt).`);
        break;
      case 'ready_next_attack':
        const remaining = request.attacksLeft || 0;
        this.showNotification('🐉 Ready for Next Attack!', 
          `Sẵn sàng đánh boss lần tiếp theo! (Còn ${remaining} lượt)`);
        break;
      case 'all_attacks_completed':
        this.showNotification('✅ All Attacks Done!', 
          'Đã hoàn thành 5/5 lượt đánh boss hôm nay! 🎉');
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
