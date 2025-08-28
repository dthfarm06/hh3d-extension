// popup.js - HH3D Khoáng Mạch Popup Script

// DOM elements
let elements = {};

// State
let currentState = null;
let updateInterval = null;
let countdownInterval = null; // NEW: Separate countdown timer
let nextRewardTime = null; // NEW: Store target time locally

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🏔️ HH3D Khoáng Mạch Popup loaded');
  
  // Cache DOM elements
  cacheElements();
  
  // Setup event listeners
  setupEventListeners();
  
  // Load initial state
  await loadInitialState();
  
  // Start auto-update
  startAutoUpdate();
  
  console.log('✅ Popup initialized');
});

// Cache DOM elements
function cacheElements() {
  elements = {
    // Status elements
    miningStatus: document.getElementById('miningStatus'),
    countdownTimer: document.getElementById('countdownTimer'),
    lastRewardTime: document.getElementById('lastRewardTime'),
    totalRewards: document.getElementById('totalRewards'),
    
    // Control elements
    toggleMining: document.getElementById('toggleMining'),
    toggleText: document.getElementById('toggleText'),
    claimRewardNow: document.getElementById('claimRewardNow'),
    refreshStatus: document.getElementById('refreshStatus'),
    forceActivate: document.getElementById('forceActivate'),
    
    // Info elements
    miningInfo: document.getElementById('miningInfo'),
    characterName: document.getElementById('characterName'),
    currentMine: document.getElementById('currentMine'),
    currentCycle: document.getElementById('currentCycle'),
    
    // Settings elements
    settingsToggle: document.getElementById('settingsToggle'),
    settingsPanel: document.getElementById('settingsPanel'),
    intervalSetting: document.getElementById('intervalSetting'),
    autoStartSetting: document.getElementById('autoStartSetting'),
    notificationsSetting: document.getElementById('notificationsSetting'),
    soundAlertSetting: document.getElementById('soundAlertSetting'),
    volumeSetting: document.getElementById('volumeSetting'),
    testSounds: document.getElementById('testSounds'),
    saveSettings: document.getElementById('saveSettings'),
    
    // Footer elements
    openMiningPage: document.getElementById('openMiningPage'),
    debugInfo: document.getElementById('debugInfo'),
    tabId: document.getElementById('tabId'),
    lastUpdate: document.getElementById('lastUpdate'),
    
    // UI elements
    loadingOverlay: document.getElementById('loadingOverlay'),
    toastContainer: document.getElementById('toastContainer')
  };
}

// Setup event listeners
function setupEventListeners() {
  // Toggle mining button
  elements.toggleMining.addEventListener('click', handleToggleMining);
  
  // Claim reward now button
  elements.claimRewardNow.addEventListener('click', handleClaimRewardNow);
  
  // Refresh status button
  elements.refreshStatus.addEventListener('click', handleRefreshStatus);
  
  // Force activate button
  elements.forceActivate.addEventListener('click', handleForceActivate);
  
  // Settings toggle
  elements.settingsToggle.addEventListener('click', handleSettingsToggle);
  
  // Save settings button
  elements.saveSettings.addEventListener('click', handleSaveSettings);
  
  // Test sounds button
  elements.testSounds.addEventListener('click', handleTestSounds);
  
  // Open mining page button
  elements.openMiningPage.addEventListener('click', handleOpenMiningPage);
  
  // Settings inputs
  elements.intervalSetting.addEventListener('change', validateSettings);
  elements.volumeSetting.addEventListener('input', handleVolumeChange);
  
  // Debug toggle (double-click version)
  elements.miningStatus.addEventListener('dblclick', toggleDebugInfo);
}

// Load initial state
async function loadInitialState() {
  try {
    showLoading(true);
    
    // Get status from background
    const response = await sendMessageToBackground('get_status');
    
    if (response.success) {
      currentState = response.state;
      updateUI(response.state, response.timeRemaining);
      loadSettings(response.state.settings);
    } else {
      showToast('❌ Không thể tải trạng thái extension', 'error');
    }
    
  } catch (error) {
    console.error('❌ Error loading initial state:', error);
    showToast('❌ Lỗi kết nối extension', 'error');
  } finally {
    showLoading(false);
  }
}

// Start auto-update timer
function startAutoUpdate() {
  // Clear existing intervals
  if (updateInterval) {
    clearInterval(updateInterval);
  }
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
  
  // Update status every 5 seconds (less frequent)
  updateInterval = setInterval(async () => {
    await updateStatus();
  }, 5000);
  
  // Start realtime countdown (every second)
  startRealtimeCountdown();
}

// Start realtime countdown
function startRealtimeCountdown() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
  
  countdownInterval = setInterval(() => {
    updateRealtimeCountdown();
  }, 1000);
}

// Update realtime countdown
function updateRealtimeCountdown() {
  if (!nextRewardTime) {
    updateCountdown(0);
    return;
  }
  
  const now = Date.now();
  const remaining = Math.max(0, nextRewardTime - now);
  const seconds = Math.ceil(remaining / 1000);
  
  updateCountdown(seconds);
  
  // If countdown reached zero, update status immediately and show notification
  if (seconds <= 0) {
    console.log('⏰ Countdown completed! Updating status...');
    
    // Play notification sound
    if (window.soundManager) {
      window.soundManager.play('notification');
    }
    
    // Show toast notification
    showToast('⏰ Đã đến giờ nhận thưởng!', 'info');
    
    updateStatus();
  }
}

// Update status from background
async function updateStatus() {
  try {
    const response = await sendMessageToBackground('get_status');
    
    if (response.success) {
      currentState = response.state;
      updateUI(response.state, response.timeRemaining);
      updateDebugInfo(response.state);
    }
    
  } catch (error) {
    // Silent error for auto-updates
    console.error('❌ Auto-update error:', error);
  }
}

// Update UI with current state
function updateUI(state, timeRemaining = 0) {
  try {
    // Update next reward time for realtime countdown
    if (state.nextRewardTime) {
      nextRewardTime = state.nextRewardTime;
    } else if (timeRemaining > 0) {
      nextRewardTime = Date.now() + (timeRemaining * 1000);
    } else {
      nextRewardTime = null;
    }
    
    // Update status
    updateMiningStatus(state);
    
    // Update countdown (will be overridden by realtime countdown)
    updateCountdown(timeRemaining);
    
    // Update statistics
    updateStatistics(state);
    
    // Update controls
    updateControls(state);
    
    // Update mining info
    updateMiningInfo(state);
    
  } catch (error) {
    console.error('❌ Error updating UI:', error);
  }
}

// Update mining status display
function updateMiningStatus(state) {
  if (!elements.miningStatus) return;
  
  let statusText, statusClass;
  
  if (state.isActive) {
    if (state.nextRewardTime && Date.now() < state.nextRewardTime) {
      statusText = '⏳ Đang chờ';
      statusClass = 'status-waiting';
    } else {
      statusText = '🔄 Đang đào';
      statusClass = 'status-active';
    }
  } else {
    statusText = '⏹️ Đã dừng';
    statusClass = 'status-inactive';
  }
  
  elements.miningStatus.textContent = statusText;
  elements.miningStatus.className = `status-value ${statusClass}`;
}

// Update countdown timer
function updateCountdown(timeRemaining) {
  if (!elements.countdownTimer) return;
  
  if (timeRemaining > 0) {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    
    elements.countdownTimer.textContent = 
      `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    elements.countdownTimer.className = 'countdown-value active';
  } else {
    elements.countdownTimer.textContent = '--:--';
    elements.countdownTimer.className = 'countdown-value';
  }
}

// Update statistics
function updateStatistics(state) {
  // Last reward time
  if (elements.lastRewardTime) {
    if (state.lastRewardTime) {
      const lastTime = new Date(state.lastRewardTime);
      elements.lastRewardTime.textContent = lastTime.toLocaleTimeString('vi-VN');
    } else {
      elements.lastRewardTime.textContent = 'Chưa có';
    }
  }
  
  // Total rewards
  if (elements.totalRewards) {
    elements.totalRewards.textContent = state.totalRewards || 0;
  }
}

// Update controls
function updateControls(state) {
  if (!elements.toggleMining || !elements.toggleText) return;
  
  if (state.isActive) {
    elements.toggleText.textContent = '⏹️ Dừng';
    elements.toggleMining.className = 'btn btn-danger';
    
    // Enable claim reward button when mining is active
    if (elements.claimRewardNow) {
      elements.claimRewardNow.disabled = false;
      elements.claimRewardNow.style.opacity = '1';
      elements.claimRewardNow.title = 'Click để nhận thưởng ngay lập tức';
    }
  } else {
    elements.toggleText.textContent = '▶️ Bắt đầu';
    elements.toggleMining.className = 'btn btn-primary';
    
    // Disable claim reward button when mining is not active
    if (elements.claimRewardNow) {
      elements.claimRewardNow.disabled = true;
      elements.claimRewardNow.style.opacity = '0.5';
      elements.claimRewardNow.title = 'Cần bật tự động nhận thưởng trước';
    }
  }
}

// Update mining info
function updateMiningInfo(state) {
  if (!elements.miningInfo) return;
  
  if (state.isActive) {
    elements.miningInfo.style.display = 'block';
    
    if (elements.currentCycle) {
      elements.currentCycle.textContent = state.currentCycle || 0;
    }
    
    if (elements.tabId) {
      elements.tabId.textContent = state.tabId || '--';
    }
  } else {
    elements.miningInfo.style.display = 'none';
  }
}

// Update debug info
function updateDebugInfo(state) {
  if (elements.lastUpdate) {
    elements.lastUpdate.textContent = new Date().toLocaleTimeString('vi-VN');
  }
  
  // DEBUG: Show countdown debug info
  console.log('🔍 Countdown Debug:', {
    nextRewardTime: nextRewardTime ? new Date(nextRewardTime).toLocaleTimeString() : 'null',
    stateNextRewardTime: state.nextRewardTime ? new Date(state.nextRewardTime).toLocaleTimeString() : 'null',
    now: new Date().toLocaleTimeString(),
    remainingMs: nextRewardTime ? Math.max(0, nextRewardTime - Date.now()) : 0
  });
}

// Handle toggle mining
async function handleToggleMining() {
  try {
    showLoading(true);
    
    const action = currentState?.isActive ? 'stop_mining' : 'start_mining';
    const response = await sendMessageToBackground(action);
    
    if (response.success) {
      const actionText = action === 'start_mining' ? 'bắt đầu' : 'dừng';
      showToast(`✅ Đã ${actionText} đào khoáng`, 'success');
      
      // Refresh status immediately
      setTimeout(() => updateStatus(), 500);
    } else {
      showToast('❌ Không thể thay đổi trạng thái đào', 'error');
    }
    
  } catch (error) {
    console.error('❌ Error toggling mining:', error);
    showToast('❌ Lỗi khi thay đổi trạng thái', 'error');
  } finally {
    showLoading(false);
  }
}

// Handle refresh status
async function handleRefreshStatus() {
  try {
    elements.refreshStatus.disabled = true;
    elements.refreshStatus.textContent = '🔄';
    
    // Check if we're on mining page
    const currentTab = await getCurrentTab();
    const isMiningPage = currentTab && currentTab.url && currentTab.url.includes('hoathinh3d.mx/khoang-mach');
    
    if (!isMiningPage) {
      showToast('⚠️ Không ở trang khoáng mạch', 'warning');
      elements.forceActivate.style.display = 'none';
    } else {
      elements.forceActivate.style.display = 'block';
    }
    
    await updateStatus();
    showToast('✅ Đã cập nhật trạng thái', 'success');
    
  } catch (error) {
    console.error('❌ Error refreshing status:', error);
    showToast('❌ Không thể cập nhật trạng thái', 'error');
  } finally {
    elements.refreshStatus.disabled = false;
    elements.refreshStatus.textContent = '🔄 Cập nhật';
  }
}

// Handle force activate
async function handleForceActivate() {
  try {
    showLoading(true);
    
    // Get current tab
    const currentTab = await getCurrentTab();
    
    if (!currentTab || !currentTab.url.includes('hoathinh3d.mx/khoang-mach')) {
      showToast('❌ Vui lòng mở trang khoáng mạch trước', 'error');
      return;
    }
    
    // Try to inject content script manually
    await chrome.scripting.executeScript({
      target: { tabId: currentTab.id },
      files: ['content.js']
    });
    
    // Wait a bit then try to start mining
    setTimeout(async () => {
      const response = await sendMessageToBackground('start_mining');
      if (response.success) {
        showToast('✅ Đã kích hoạt extension thủ công', 'success');
        elements.forceActivate.style.display = 'none';
        setTimeout(() => updateStatus(), 500);
      } else {
        showToast('❌ Không thể kích hoạt', 'error');
      }
    }, 1000);
    
  } catch (error) {
    console.error('❌ Error force activating:', error);
    showToast('❌ Lỗi kích hoạt thủ công', 'error');
  } finally {
    showLoading(false);
  }
}

// Get current active tab
async function getCurrentTab() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs.length > 0 ? tabs[0] : null;
  } catch (error) {
    console.error('❌ Error getting current tab:', error);
    return null;
  }
}

// Handle settings toggle
function handleSettingsToggle() {
  const isVisible = elements.settingsPanel.style.display !== 'none';
  elements.settingsPanel.style.display = isVisible ? 'none' : 'block';
  elements.settingsToggle.textContent = isVisible ? '⚙️ Cài đặt' : '⚙️ Đóng';
}

// Handle save settings
async function handleSaveSettings() {
  try {
    showLoading(true);
    
    const settings = {
      interval: parseInt(elements.intervalSetting.value) || 15,
      autoStart: elements.autoStartSetting.checked,
      notifications: elements.notificationsSetting.checked,
      soundAlert: elements.soundAlertSetting.checked
    };
    
    // Validate settings
    if (settings.interval < 1 || settings.interval > 60) {
      showToast('❌ Khoảng thời gian phải từ 1-60 phút', 'error');
      return;
    }
    
    // Save via background script
    const response = await sendMessageToBackground('save_settings', { settings });
    
    if (response.success) {
      showToast('✅ Đã lưu cài đặt', 'success');
      
      // If mining is active and interval changed, show warning
      if (currentState?.isActive && settings.interval !== currentState.settings?.interval) {
        showToast('⚠️ Thay đổi sẽ áp dụng cho chu kỳ tiếp theo', 'warning');
      }
      
      // Reload current state to reflect changes
      setTimeout(() => updateStatus(), 500);
    } else {
      showToast('❌ Không thể lưu cài đặt', 'error');
    }
    
  } catch (error) {
    console.error('❌ Error saving settings:', error);
    showToast('❌ Không thể lưu cài đặt', 'error');
  } finally {
    showLoading(false);
  }
}

// Handle open mining page
async function handleOpenMiningPage() {
  try {
    const url = 'https://hoathinh3d.mx/khoang-mach?t=ab487';
    
    // Try to find existing tab first
    const tabs = await chrome.tabs.query({ url: 'https://hoathinh3d.mx/khoang-mach?t=ab487' });
    
    if (tabs.length > 0) {
      // Switch to existing tab
      await chrome.tabs.update(tabs[0].id, { active: true });
      await chrome.windows.update(tabs[0].windowId, { focused: true });
      showToast('✅ Đã chuyển đến tab khoáng mạch', 'success');
    } else {
      // Create new tab
      await chrome.tabs.create({ url: url });
      showToast('✅ Đã mở trang khoáng mạch', 'success');
    }
    
    // Close popup
    window.close();
    
  } catch (error) {
    console.error('❌ Error opening mining page:', error);
    showToast('❌ Không thể mở trang khoáng mạch', 'error');
  }
}

// Load settings into UI
function loadSettings(settings) {
  if (!settings) return;
  
  if (elements.intervalSetting) {
    elements.intervalSetting.value = settings.interval || 15;
  }
  
  if (elements.autoStartSetting) {
    elements.autoStartSetting.checked = settings.autoStart !== false;
  }
  
  if (elements.notificationsSetting) {
    elements.notificationsSetting.checked = settings.notifications !== false;
  }
  
  if (elements.soundAlertSetting) {
    elements.soundAlertSetting.checked = settings.soundAlert === true;
  }
}

// Validate settings
function validateSettings() {
  const interval = parseInt(elements.intervalSetting.value);
  
  if (isNaN(interval) || interval < 1 || interval > 60) {
    elements.intervalSetting.style.borderColor = '#f44336';
    showToast('❌ Khoảng thời gian phải từ 1-60 phút', 'warning');
  } else {
    elements.intervalSetting.style.borderColor = '';
  }
}

// Toggle debug info
function toggleDebugInfo() {
  const isVisible = elements.debugInfo.style.display !== 'none';
  elements.debugInfo.style.display = isVisible ? 'none' : 'block';
}

// Show/hide loading overlay
function showLoading(show) {
  if (elements.loadingOverlay) {
    elements.loadingOverlay.style.display = show ? 'flex' : 'none';
  }
}

// Show toast notification
function showToast(message, type = 'info') {
  try {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    elements.toastContainer.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
    
  } catch (error) {
    console.error('❌ Error showing toast:', error);
  }
}

// Send message to background script
function sendMessageToBackground(action, data = {}) {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(
        { action, ...data },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response || {});
          }
        }
      );
    } catch (error) {
      reject(error);
    }
  });
}

// Handle claim reward now button click
async function handleClaimRewardNow() {
  console.log('🎁 Claim Reward Now button clicked');
  
  try {
    // Disable button during operation
    elements.claimRewardNow.disabled = true;
    elements.claimRewardNow.textContent = '⏳ Đang nhận...';
    
    // Play notification sound
    if (window.soundManager) {
      window.soundManager.play('notification');
    }
    
    showToast('🎁 Đang thực hiện nhận thưởng...', 'info');
    
    // Send manual trigger message to background
    const response = await sendMessageToBackground('manual_claim_reward', {
      timestamp: Date.now()
    });
    
    if (response.success) {
      // Play success sound
      if (window.soundManager) {
        window.soundManager.play('success');
      }
      
      showToast('✅ Yêu cầu nhận thưởng đã được gửi!', 'success');
      
      // Refresh status after a short delay
      setTimeout(async () => {
        await updateStatus();
        showToast('🎉 Nhận thưởng hoàn thành! Countdown đã restart.', 'success');
      }, 3000);
      
    } else {
      throw new Error(response.error || 'Không thể gửi yêu cầu nhận thưởng');
    }
    
  } catch (error) {
    console.error('❌ Error claiming reward:', error);
    
    // Play error sound
    if (window.soundManager) {
      window.soundManager.play('error');
    }
    
    showToast('❌ Lỗi: ' + error.message, 'error');
  } finally {
    // Re-enable button
    elements.claimRewardNow.disabled = false;
    elements.claimRewardNow.innerHTML = '🎁 Nhận Thưởng Ngay';
  }
}

// Cleanup on popup close
window.addEventListener('beforeunload', () => {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
});

console.log('🏔️ HH3D Khoáng Mạch Popup Script Loaded');
