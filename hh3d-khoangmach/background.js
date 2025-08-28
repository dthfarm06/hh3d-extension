// HH3D Khoáng Mạch Auto Extension - Background Script (Service Worker)
// Manifest V3 compatible - NO global variables

// Constants
const ALARM_NAME = 'mining_alarm';
const STORAGE_KEY = 'hh3d_mining_state';
const SETTINGS_KEY = 'hh3d_mining_settings';

// Default settings
const DEFAULT_SETTINGS = {
  interval: 15,          // minutes
  notifications: true,
  autoStart: false,
  enabled: true
};

// Default state
const DEFAULT_STATE = {
  isActive: false,
  tabId: null,
  lastRewardTime: null,
  nextRewardTime: null,
  totalRewards: 0,
  currentCycle: 0,
  settings: DEFAULT_SETTINGS
};

// Service worker event listeners
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('🏔️ HH3D Khoáng Mạch Extension installed:', details.reason);
  await initializeExtension();
});

chrome.runtime.onStartup.addListener(async () => {
  console.log('🔄 Service worker starting up...');
  await initializeExtension();
  await restoreMiningSession();
});

// Initialize extension
async function initializeExtension() {
  try {
    // Load user settings first
    const settings = await getUserSettings();
    
    // Get or create initial state
    const currentState = await getCurrentState();
    currentState.settings = settings;
    
    await saveMiningState(currentState);
    updateBadge('OFF');
    console.log('✅ Extension initialized with settings:', settings);
  } catch (error) {
    console.error('❌ Error initializing extension:', error);
  }
}

// Get current state from storage
async function getCurrentState() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return { ...DEFAULT_STATE, ...result[STORAGE_KEY] };
  } catch (error) {
    console.error('❌ Error getting current state:', error);
    return { ...DEFAULT_STATE };
  }
}

// Save mining state to storage
async function saveMiningState(stateUpdate) {
  try {
    const currentState = await getCurrentState();
    const newState = { ...currentState, ...stateUpdate };
    await chrome.storage.local.set({ [STORAGE_KEY]: newState });
    console.log('💾 Mining state saved:', stateUpdate);
  } catch (error) {
    console.error('❌ Error saving mining state:', error);
    throw error;
  }
}

// Restore mining session after restart
async function restoreMiningSession() {
  try {
    const currentState = await getCurrentState();
    
    if (currentState.isActive && currentState.nextRewardTime) {
      const now = Date.now();
      const timeUntilNext = currentState.nextRewardTime - now;
      
      if (timeUntilNext > 0) {
        // Still time left, restore alarm
        const delayMinutes = Math.max(0.1, timeUntilNext / (1000 * 60));
        await setupMiningAlarm(delayMinutes);
        updateBadge('WAIT');
        console.log(`🔄 Restored mining session, ${Math.ceil(delayMinutes)} minutes remaining`);
      } else {
        // Time expired, trigger reward immediately
        console.log('⏰ Mining time expired during restart, triggering reward');
        await handleRewardTrigger();
      }
    }
  } catch (error) {
    console.error('❌ Error restoring mining session:', error);
  }
}

// Setup mining alarm
async function setupMiningAlarm(delayMinutes = null) {
  try {
    // Get current settings to determine interval
    const settings = await getUserSettings();
    const intervalMinutes = delayMinutes || settings.interval;
    
    // Clear existing alarm
    await chrome.alarms.clear(ALARM_NAME);
    
    // Create new alarm
    await chrome.alarms.create(ALARM_NAME, { 
      delayInMinutes: Math.max(0.1, intervalMinutes) 
    });
    
    // Update next reward time
    const nextTime = Date.now() + (intervalMinutes * 60 * 1000);
    await saveMiningState({ 
      nextRewardTime: nextTime,
      isActive: true 
    });
    
    updateBadge('WAIT');
    console.log(`⏰ Mining alarm set for ${intervalMinutes.toFixed(1)} minutes`);
    
  } catch (error) {
    console.error('❌ Error setting up mining alarm:', error);
  }
}

// Handle alarm trigger
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    console.log('🔔 Mining alarm triggered at:', new Date().toISOString());
    console.log('🔔 Alarm details:', alarm);
    await handleRewardTrigger();
  } else {
    console.log('🔔 Unknown alarm triggered:', alarm);
  }
});

// Handle reward trigger
async function handleRewardTrigger() {
  try {
    console.log('🎯 === REWARD TRIGGER STARTED ===');
    console.log('🎯 Current time:', new Date().toISOString());
    
    updateBadge('ON');
    
    // Check if mining tab is available
    const miningTab = await findMiningTab();
    console.log('🔍 Mining tab search result:', miningTab ? `Found tab ${miningTab.id}` : 'No tab found');
    
    if (miningTab) {
      // Verify tab is still valid and content script is loaded
      console.log('🔍 Verifying tab and content script...');
      const isTabValid = await verifyTabAndContentScript(miningTab.id);
      console.log('✅ Tab verification result:', isTabValid);
      
      if (isTabValid) {
        // Send message to content script to collect reward
        try {
          console.log('📨 Sending collect_reward message to tab:', miningTab.id);
          const response = await chrome.tabs.sendMessage(miningTab.id, {
            action: 'collect_reward',
            timestamp: Date.now()
          });
          
          console.log('📨 Message response:', response);
          console.log('✅ Collect reward message sent successfully');
        } catch (messageError) {
          console.error('❌ Failed to send message to content script:', messageError);
          await handleRewardFailed('Failed to send collect_reward message: ' + messageError.message);
        }
      } else {
        // Tab invalid or content script not loaded, try to inject and retry
        console.log('❌ Tab invalid or content script not loaded');
        console.log('🔄 Attempting to inject content script and retry...');
        
        try {
          await injectContentScriptIfNeeded(miningTab.id);
          
          // Wait for content script to initialize
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Verify again after injection
          const isTabValidAfterInject = await verifyTabAndContentScript(miningTab.id);
          console.log('✅ Tab verification after injection:', isTabValidAfterInject);
          
          if (isTabValidAfterInject) {
            // Try to send message again
            console.log('� Sending collect_reward message after injection...');
            const response = await chrome.tabs.sendMessage(miningTab.id, {
              action: 'collect_reward',
              timestamp: Date.now()
            });
            console.log('✅ Message sent successfully after injection:', response);
          } else {
            console.log('❌ Tab still not valid after injection');
            await handleTabInvalid();
          }
        } catch (injectError) {
          console.error('❌ Failed to inject content script:', injectError);
          await handleTabInvalid();
        }
      }
    } else {
      // No mining tab found, show notification
      const currentState = await getCurrentState();
      if (currentState.settings.notifications) {
        await showNotification('⚠️ Cảnh báo', 'Không tìm thấy tab khoáng mạch. Vui lòng mở trang để tiếp tục.');
      }
      
      // Stop mining temporarily
      await saveMiningState({ isActive: false });
      updateBadge('OFF');
      console.log('❌ No mining tab found, stopped mining');
    }
    
  } catch (error) {
    console.error('❌ Error handling reward trigger:', error);
    
    // Retry after 1 minute
    await setupMiningAlarm(1);
  }
}

// Find mining tab
async function findMiningTab() {
  try {
    const tabs = await chrome.tabs.query({
      url: ["*://hoathinh3d.mx/*khoang-mach?t=ab487", "*://www.hoathinh3d.mx/*khoang-mach?t=ab487"]
    });
    
    return tabs.find(tab => tab.url.includes('khoang-mach')) || null;
  } catch (error) {
    console.error('❌ Error finding mining tab:', error);
    return null;
  }
}

// Verify tab is valid and content script is loaded
async function verifyTabAndContentScript(tabId) {
  try {
    // First check if tab still exists
    const tab = await chrome.tabs.get(tabId);
    if (!tab || tab.discarded) {
      console.log('❌ Tab does not exist or is discarded');
      return false;
    }
    
    // Check if it's still a mining page
    if (!tab.url.includes('khoang-mach')) {
      console.log('❌ Tab is no longer on mining page');
      return false;
    }
    
    // Try to ping content script
    try {
      const response = await chrome.tabs.sendMessage(tabId, {
        action: 'ping'
      });
      
      if (response && response.success) {
        console.log('✅ Content script is responsive');
        return true;
      } else {
        console.log('❌ Content script not responsive');
        return false;
      }
    } catch (pingError) {
      console.log('❌ Content script ping failed:', pingError.message);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error verifying tab:', error);
    return false;
  }
}

// Inject content script if needed
async function injectContentScriptIfNeeded(tabId) {
  try {
    console.log('🔄 Attempting to inject content script into tab:', tabId);
    
    // Inject sound manager first
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['sounds/sound-manager.js']
    });
    
    // Then inject content script
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    });
    
    console.log('✅ Content script and sound manager injected successfully');
    
    // Wait a bit for content script to initialize
    await new Promise(resolve => setTimeout(resolve, 1500));
    
  } catch (error) {
    console.error('❌ Error injecting content script:', error);
  }
}

// Handle when tab is invalid
async function handleTabInvalid() {
  try {
    console.log('🔄 Handling invalid tab, will retry in 2 minutes...');
    
    // Show notification if enabled
    const currentState = await getCurrentState();
    if (currentState.settings.notifications) {
      await showNotification(
        '⚠️ Tab không hợp lệ', 
        'Tab khoáng mạch không phản hồi. Sẽ thử lại sau 2 phút.'
      );
    }
    
    // Retry after 2 minutes
    await setupMiningAlarm(2);
    
  } catch (error) {
    console.error('❌ Error handling invalid tab:', error);
  }
}

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Received message:', request);

  (async () => {
    try {
      switch (request.action) {
        case 'get_status':
          const currentState = await getCurrentState();
          const settings = await getUserSettings();
          const timeRemaining = await getTimeRemaining();
          
          sendResponse({ 
            success: true, 
            state: { ...currentState, settings: settings },
            timeRemaining: timeRemaining
          });
          break;

        case 'start_mining':
          await startMining(request.tabId || sender.tab?.id);
          sendResponse({ success: true, message: 'Mining started' });
          break;

        case 'stop_mining':
          await stopMining();
          sendResponse({ success: true, message: 'Mining stopped' });
          break;

        case 'save_settings':
          const savedSettings = await saveUserSettings(request.settings);
          sendResponse({ success: true, settings: savedSettings });
          break;

        case 'reward_collected':
          await handleRewardCollected(request.data);
          sendResponse({ success: true, message: 'Reward collected successfully' });
          break;

        case 'reward_failed':
          await handleRewardFailed(request.error);
          sendResponse({ success: true, message: 'Error handled' });
          break;

        case 'page_loaded':
          await handlePageLoaded(sender.tab?.id);
          sendResponse({ success: true, message: 'Page loaded handled' });
          break;

        case 'debug_extension':
          const debugInfo = await debugExtension();
          sendResponse({ success: true, debug: debugInfo });
          break;

        case 'debug_trigger_reward':
          const triggerResult = await debugTriggerReward();
          sendResponse(triggerResult);
          break;

        case 'manual_claim_reward':
          const manualClaimResult = await handleManualClaimReward();
          sendResponse(manualClaimResult);
          break;

        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('❌ Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  })();

  return true; // Keep message channel open
});

// Start mining
async function startMining(tabId) {
  try {
    const settings = await getUserSettings();
    const currentState = await getCurrentState();
    
    await saveMiningState({
      isActive: true,
      tabId: tabId,
      currentCycle: currentState.currentCycle + 1
    });
    
    await setupMiningAlarm(settings.interval);
    
    if (settings.notifications) {
      await showNotification('🚀 Bắt đầu đào', `Đã bắt đầu chu trình đào khoáng mạch tự động (${settings.interval} phút/lần)`);
    }
    
    console.log(`🚀 Mining started for tab: ${tabId}, interval: ${settings.interval} minutes`);
  } catch (error) {
    console.error('❌ Error starting mining:', error);
  }
}

// Stop mining
async function stopMining() {
  try {
    await chrome.alarms.clear(ALARM_NAME);
    
    await saveMiningState({
      isActive: false,
      nextRewardTime: null
    });
    
    updateBadge('OFF');
    
    const currentState = await getCurrentState();
    if (currentState.settings.notifications) {
      await showNotification('⏹️ Dừng đào', 'Đã dừng chu trình đào khoáng mạch');
    }
    
    console.log('⏹️ Mining stopped');
  } catch (error) {
    console.error('❌ Error stopping mining:', error);
  }
}

// Handle reward collected successfully
async function handleRewardCollected(data) {
  try {
    const now = Date.now();
    const settings = await getUserSettings();
    const currentState = await getCurrentState();
    
    const newState = {
      lastRewardTime: now,
      totalRewards: currentState.totalRewards + 1
    };
    
    await saveMiningState(newState);
    
    // Setup next reward cycle using current interval setting
    await setupMiningAlarm(settings.interval);
    
    if (settings.notifications) {
      await showNotification(
        '✅ Nhận thưởng thành công', 
        `Đã nhận thưởng lần ${newState.totalRewards}. Chu kỳ tiếp theo sau ${settings.interval} phút.`
      );
    }
    
    console.log(`✅ Reward collected successfully, total: ${newState.totalRewards}, next in ${settings.interval} minutes`);
  } catch (error) {
    console.error('❌ Error handling reward collected:', error);
  }
}

// Handle reward collection failed
async function handleRewardFailed(error) {
  try {
    console.error('❌ Reward collection failed:', error);
    
    // Retry after 2 minutes
    await setupMiningAlarm(2);
    
    const currentState = await getCurrentState();
    if (currentState.settings.notifications) {
      await showNotification(
        '❌ Lỗi nhận thưởng', 
        'Không thể nhận thưởng, sẽ thử lại sau 2 phút.'
      );
    }
  } catch (err) {
    console.error('❌ Error handling reward failure:', err);
  }
}

// Handle page loaded
async function handlePageLoaded(tabId) {
  try {
    console.log('📄 Mining page loaded in tab:', tabId);
    
    // Update tab ID
    await saveMiningState({ tabId: tabId });
    
    // Get current settings and state
    const settings = await getUserSettings();
    const currentState = await getCurrentState();
    
    // Auto-start if enabled and not already running
    if (settings.autoStart && !currentState.isActive) {
      console.log('🚀 Auto-starting mining (autoStart enabled)');
      await startMining(tabId);
    } else if (currentState.isActive) {
      console.log('✅ Mining already active, updating tab ID only');
      updateBadge('WAIT');
    } else {
      console.log('⏸️ Mining not started (autoStart disabled or manual control)');
      updateBadge('OFF');
    }
  } catch (error) {
    console.error('❌ Error handling page loaded:', error);
  }
}

// Get time remaining until next reward
async function getTimeRemaining() {
  try {
    const currentState = await getCurrentState();
    
    if (!currentState.nextRewardTime) return 0;
    
    const now = Date.now();
    const remaining = Math.max(0, currentState.nextRewardTime - now);
    
    return Math.ceil(remaining / 1000); // seconds
  } catch (error) {
    console.error('❌ Error getting time remaining:', error);
    return 0;
  }
}

// Show notification
async function showNotification(title, message) {
  try {
    const currentState = await getCurrentState();
    if (!currentState.settings.notifications) return;
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: title,
      message: message
    });
  } catch (error) {
    console.error('❌ Error showing notification:', error);
  }
}

// Tab management
chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  const currentState = await getCurrentState();
  if (tabId === currentState.tabId) {
    console.log('📭 Mining tab closed:', tabId);
    
    // Don't stop mining immediately, user might reopen the tab
    // Just update the tab ID
    await saveMiningState({ tabId: null });
  }
});

// Keep service worker alive
chrome.runtime.onConnect.addListener((port) => {
  console.log('🔌 Port connected:', port.name);
});

// Get user settings with defaults
async function getUserSettings() {
  try {
    const result = await chrome.storage.local.get(SETTINGS_KEY);
    return { ...DEFAULT_SETTINGS, ...result[SETTINGS_KEY] };
  } catch (error) {
    console.error('❌ Error getting user settings:', error);
    return DEFAULT_SETTINGS;
  }
}

// Save user settings
async function saveUserSettings(settings) {
  try {
    // Validate settings
    const validatedSettings = {
      interval: Math.max(0.1, Math.min(1440, parseFloat(settings.interval) || DEFAULT_SETTINGS.interval)),
      notifications: Boolean(settings.notifications),
      autoStart: Boolean(settings.autoStart),
      enabled: Boolean(settings.enabled)
    };
    
    await chrome.storage.local.set({ [SETTINGS_KEY]: validatedSettings });
    
    // Update current state settings
    const currentState = await getCurrentState();
    currentState.settings = validatedSettings;
    await saveMiningState(currentState);
    
    console.log('💾 User settings saved:', validatedSettings);
    return validatedSettings;
  } catch (error) {
    console.error('❌ Error saving user settings:', error);
    throw error;
  }
}

// Update badge
function updateBadge(status) {
  const badgeMap = {
    'ON': { text: '⚡', color: '#4CAF50' },
    'WAIT': { text: '⏳', color: '#FF9800' },
    'OFF': { text: '', color: '#f44336' }
  };
  
  const badge = badgeMap[status] || badgeMap['OFF'];
  
  chrome.action.setBadgeText({ text: badge.text });
  chrome.action.setBadgeBackgroundColor({ color: badge.color });
}

console.log('🏔️ HH3D Khoáng Mạch Service Worker Loaded');

// Debug function - accessible via chrome.runtime.sendMessage
// Call: chrome.runtime.sendMessage({action: 'debug_extension'})
async function debugExtension() {
  console.log('🔍 Extension Debug Info:');
  
  const currentState = await getCurrentState();
  const settings = await getUserSettings();
  const timeRemaining = await getTimeRemaining();
  const miningTab = await findMiningTab();
  
  const debug = {
    currentState,
    settings,
    timeRemaining,
    miningTab: miningTab ? { id: miningTab.id, url: miningTab.url } : null,
    timestamp: new Date().toISOString()
  };
  
  console.table(debug);
  return debug;
}

// Debug function to manually trigger reward collection
// Call: chrome.runtime.sendMessage({action: 'debug_trigger_reward'})
async function debugTriggerReward() {
  console.log('🧪 DEBUG: Manually triggering reward collection...');
  try {
    await handleRewardTrigger();
    return { success: true, message: 'Reward trigger initiated' };
  } catch (error) {
    console.error('❌ DEBUG: Reward trigger failed:', error);
    return { success: false, error: error.message };
  }
}

// Handle manual claim reward from popup button
async function handleManualClaimReward() {
  console.log('🎁 MANUAL CLAIM: User clicked "Nhận Thưởng Ngay" button');
  
  try {
    // Clear any existing alarm first
    await chrome.alarms.clear(ALARM_NAME);
    console.log('🗑️ Cleared existing alarm for manual claim');
    
    // Trigger reward collection immediately
    console.log('⚡ Triggering immediate reward collection...');
    await handleRewardTrigger();
    
    console.log('✅ Manual claim reward initiated successfully');
    return { 
      success: true, 
      message: 'Nhận thưởng manual đã được khởi động',
      timestamp: Date.now()
    };
    
  } catch (error) {
    console.error('❌ Manual claim reward failed:', error);
    return { 
      success: false, 
      error: error.message,
      timestamp: Date.now()
    };
  }
}
