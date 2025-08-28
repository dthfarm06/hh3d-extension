// content.js - HH3D Khoáng Mạch Content Script

// Constants
// Constants
const REWARD_BUTTON_SELECTORS = [
  // CSS class selectors
  '.reward-button',
  '.btn-reward',
  '.claim-button',
  '.collect-button',
  
  // ID selectors
  '#rewardButton',
  '#claimButton',
  '#collectButton',
  
  // Attribute selectors
  'button[class*="reward"]',
  'button[id*="reward"]',
  'input[value*="Nhận"]',
  'input[value*="nhận"]',
  'a[href*="reward"]',
  'a[href*="claim"]',
  
  // Generic button selectors for mining
  '.mining-reward',
  '.mine-collect',
  '[data-action="reward"]',
  '[data-action="collect"]'
];

const MINING_INDICATORS = [
  '.mining-status',
  '.mine-info',
  '.khoang-mach-status'
];

// State
let isContentScriptActive = false;
let rewardCollectionInProgress = false;
let pageMonitorInterval = null;

// Initialize content script
function initializeContentScript() {
  if (isContentScriptActive) {
    console.log('⚠️ Content script already active, skipping initialization');
    return;
  }
  
  console.log('🏔️ HH3D Khoáng Mạch Content Script Initializing...');
  console.log('🔍 Current URL:', window.location.href);
  
  // Check if we're on the correct page
  if (!isKhoangMachPage()) {
    console.log('❌ Not on khoáng mạch page, content script inactive');
    console.log('🔍 Expected: URL containing "hoathinh3d.mx/khoang-mach"');
    return;
  }
  
  isContentScriptActive = true;
  console.log('✅ Khoáng mạch page detected, activating content script');
  
  // Notify background that page is loaded
  notifyPageLoaded();
  
  // Start monitoring page
  startPageMonitoring();
  
  // Setup message listener
  setupMessageListener();
  
  console.log('✅ Content script ready on khoáng mạch page');
}

// Check if current page is khoáng mạch page
function isKhoangMachPage() {
  const url = window.location.href;
  console.log('🔍 DEBUG: Current URL:', url);
  
  const isMatch = url.includes('hoathinh3d.mx/khoang-mach') || 
                  url.includes('hoathinh3d.mx/khoang-mach?t=ab487');
  
  console.log('🔍 DEBUG: Is khoáng mạch page:', isMatch);
  return isMatch;
}

// Notify background that page is loaded
function notifyPageLoaded() {
  try {
    console.log('📨 Notifying background: page loaded');
    
    chrome.runtime.sendMessage({
      action: 'page_loaded',
      url: window.location.href,
      timestamp: Date.now()
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('❌ Error sending page_loaded message:', chrome.runtime.lastError.message);
      } else {
        console.log('✅ Successfully notified background script');
        console.log('📨 Response:', response);
      }
    });
  } catch (error) {
    console.error('❌ Error notifying page loaded:', error);
  }
}

// Setup message listener for background communication
function setupMessageListener() {
  // Remove existing listener if any
  if (chrome.runtime.onMessage.hasListeners()) {
    chrome.runtime.onMessage.removeListener(handleMessage);
  }
  
  // Add new listener
  chrome.runtime.onMessage.addListener(handleMessage);
}

// Handle messages from background script
function handleMessage(message, sender, sendResponse) {
  console.log('📨 Content script received message:', message.action);
  
  try {
    switch (message.action) {
      case 'collect_reward':
        handleRewardCollection()
          .then(() => {
            console.log('✅ Reward collection completed successfully');
            sendResponse({ success: true, timestamp: Date.now() });
          })
          .catch(error => {
            console.error('❌ Reward collection failed:', error);
            sendResponse({ success: false, error: error.message, timestamp: Date.now() });
          });
        break;
        
      case 'check_reward_status':
        try {
          const rewardButton = findRewardButton();
          const isAvailable = checkRewardAvailable();
          
          sendResponse({ 
            success: true, 
            hasReward: isAvailable,
            buttonFound: rewardButton !== null,
            buttonType: rewardButton ? rewardButton.tagName : null,
            timestamp: Date.now()
          });
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
        break;
        
      case 'ping':
        try {
          console.log('🏓 Content script ping received');
          sendResponse({ 
            success: true, 
            active: isContentScriptActive,
            url: window.location.href,
            timestamp: Date.now() 
          });
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
        break;
        
      case 'get_page_info':
        try {
          const pageInfo = {
            success: true,
            url: window.location.href,
            isKhoangMachPage: isKhoangMachPage(),
            miningInfo: getMiningInfo(),
            contentScriptActive: isContentScriptActive,
            timestamp: Date.now()
          };
          
          console.log('📨 Sending page info:', pageInfo);
          sendResponse(pageInfo);
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
        break;
        
      default:
        console.log('⚠️ Unknown action received:', message.action);
        sendResponse({ success: false, error: 'Unknown action: ' + message.action });
    }
  } catch (error) {
    console.error('❌ Error handling message:', error);
    sendResponse({ success: false, error: 'Message handler error: ' + error.message });
  }
  
  return true; // Keep message channel open for async response
}

// Start monitoring page for changes
function startPageMonitoring() {
  // Clear existing interval
  if (pageMonitorInterval) {
    clearInterval(pageMonitorInterval);
  }
  
  // Monitor every 30 seconds
  pageMonitorInterval = setInterval(() => {
    checkPageStatus();
  }, 30000);
  
  // Initial check
  checkPageStatus();
}

// Check page status
function checkPageStatus() {
  try {
    const rewardButton = findRewardButton();
    const miningInfo = getMiningInfo();
    
    console.log('🔍 Page status check:', {
      hasRewardButton: !!rewardButton,
      rewardAvailable: checkRewardAvailable(),
      miningInfo
    });
    
  } catch (error) {
    console.error('❌ Error checking page status:', error);
  }
}

// Handle reward collection - ENHANCED VERSION
async function handleRewardCollection() {
  if (rewardCollectionInProgress) {
    console.log('⚠️ Reward collection already in progress');
    return;
  }
  
  rewardCollectionInProgress = true;
  
  try {
    console.log('🎁 Starting reward collection process (ENHANCED FLOW)...');
    
    // Step 1: Click refresh button first (with retry)
    let refreshSuccess = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      console.log(`🔄 Refresh attempt ${attempt}/3...`);
      const refreshResult = await clickRefreshButton();
      
      if (refreshResult.success) {
        console.log('✅ Refresh button clicked successfully');
        refreshSuccess = true;
        break;
      } else {
        console.log(`⚠️ Refresh attempt ${attempt} failed:`, refreshResult.error);
        if (attempt < 3) {
          await sleep(1000); // Wait before retry
        }
      }
    }
    
    if (!refreshSuccess) {
      console.log('⚠️ All refresh attempts failed, continuing without refresh...');
    }
    
    // Wait for page to refresh/update
    await sleep(refreshSuccess ? 3000 : 1000);
    
    // Step 2: Find reward target (with retry)
    let rewardTarget = null;
    for (let attempt = 1; attempt <= 5; attempt++) {
      console.log(`🎯 Looking for reward target, attempt ${attempt}/5...`);
      rewardTarget = findRewardButton();
      
      if (rewardTarget) {
        console.log('✅ Found reward target:', rewardTarget.tagName, rewardTarget.src || rewardTarget.textContent);
        break;
      } else {
        console.log(`⚠️ Reward target not found on attempt ${attempt}`);
        if (attempt < 5) {
          await sleep(2000); // Wait before retry
        }
      }
    }
    
    if (!rewardTarget) {
      throw new Error('Không tìm thấy ảnh -inside.png hoặc nút nhận thưởng sau 5 lần thử');
    }
    
    // Step 3: Check if reward is available (skip for image targets)
    if (rewardTarget.tagName !== 'IMG' && !checkRewardAvailable()) {
      throw new Error('Chưa đến thời gian nhận thưởng');
    }
    
    // Step 4: Scroll to target and ensure visibility
    scrollToElement(rewardTarget);
    await sleep(1500);
    
    // Step 5: Execute click flow (handles both image and button) with retry
    console.log('🖱️ Executing click flow...');
    let clickSuccess = false;
    let clickResult = null;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      console.log(`🖱️ Click attempt ${attempt}/3...`);
      clickResult = await clickRewardButton(rewardTarget);
      
      if (clickResult.success) {
        console.log('✅ Click flow completed successfully, method:', clickResult.method);
        clickSuccess = true;
        break;
      } else {
        console.log(`⚠️ Click attempt ${attempt} failed:`, clickResult.error);
        if (attempt < 3) {
          await sleep(1000); // Wait before retry
        }
      }
    }
    
    if (!clickSuccess) {
      throw new Error(clickResult?.error || 'Không thể thực hiện luồng nhận thưởng sau 3 lần thử');
    }
    
    // Step 6: Wait and verify success
    await sleep(4000); // Wait longer for popup flow
    const verificationResult = await verifyRewardCollection();
    
    if (verificationResult.success) {
      // Notify background of successful collection
      chrome.runtime.sendMessage({
        action: 'reward_collected',
        data: {
          timestamp: Date.now(),
          buttonText: rewardTarget.textContent || rewardTarget.value || rewardTarget.src,
          verificationData: verificationResult.data
        }
      });
      
      // Play success sound
      if (window.soundManager) {
        window.soundManager.play('reward');
      }
      
      console.log('🎉 Reward collection successful!');
    } else {
      throw new Error(verificationResult.error || 'Không thể xác minh việc nhận thưởng');
    }
    
  } catch (error) {
    console.error('❌ Reward collection failed:', error);
    
    // Play error sound
    if (window.soundManager) {
      window.soundManager.play('error');
    }
    
    // Notify background of failure
    chrome.runtime.sendMessage({
      action: 'reward_failed',
      error: error.message,
      timestamp: Date.now()
    });
    
    throw error;
  } finally {
    rewardCollectionInProgress = false;
  }
}

// Click refresh button before looking for reward
async function clickRefreshButton() {
  try {
    console.log('🔄 Looking for refresh button (reload-btn)...');
    
    // Find the reload button by ID first
    let reloadButton = document.querySelector('#reload-btn');
    
    if (!reloadButton) {
      console.log('❌ Reload button not found by ID, trying alternative selectors...');
      
      // Try alternative selectors for refresh button
      const alternatives = [
        'button[id*="reload"]',
        'button[class*="reload"]', 
        'button[class*="refresh"]',
        'button[title*="Làm mới"]',
        'button[title*="refresh"]',
        'button[onclick*="reload"]',
        'button[onclick*="refresh"]',
        'button .fas.fa-sync-alt', // Icon-based search
        'i.fa-sync-alt', // Direct icon search
        'button:contains("Làm mới")',
        'button:contains("Refresh")'
      ];
      
      for (const selector of alternatives) {
        try {
          if (selector.includes(':contains')) {
            // Handle text-based search manually
            const buttons = document.querySelectorAll('button');
            for (const btn of buttons) {
              const text = btn.textContent.trim().toLowerCase();
              if (text.includes('làm mới') || text.includes('refresh')) {
                reloadButton = btn;
                console.log('✅ Found refresh button by text content:', text);
                break;
              }
            }
          } else {
            const element = document.querySelector(selector);
            if (element) {
              // If it's an icon, get the parent button
              reloadButton = element.tagName === 'I' ? element.closest('button') : element;
              if (reloadButton && isElementInteractable(reloadButton)) {
                console.log('✅ Found refresh button via alternative selector:', selector);
                break;
              }
            }
          }
        } catch (err) {
          console.log(`⚠️ Error with selector ${selector}:`, err.message);
        }
      }
      
      if (!reloadButton) {
        console.log('❌ No refresh button found with any method');
        return { success: false, error: 'Refresh button not found' };
      }
    }
    
    console.log('✅ Found reload button:', reloadButton);
    
    // Check if button is interactable
    if (!isElementInteractable(reloadButton)) {
      console.log('❌ Reload button is not interactable');
      return { success: false, error: 'Reload button is not interactable' };
    }
    
    // Scroll to button and click it
    scrollToElement(reloadButton);
    await sleep(500);
    
    const clickResult = await performClick(reloadButton);
    
    if (clickResult.success) {
      console.log('✅ Refresh button clicked successfully');
      return { success: true };
    } else {
      return { success: false, error: 'Failed to click refresh button: ' + clickResult.error };
    }
    
  } catch (error) {
    console.error('❌ Error clicking refresh button:', error);
    return { success: false, error: error.message };
  }
}

// Find reward button on page - ENHANCED VERSION
function findRewardButton() {
  console.log('🔍 Looking for mining images with -inside.png suffix...');
  
  // STEP 1: Find images ending with -inside.png
  try {
    const allImages = document.querySelectorAll('img');
    console.log(`Found ${allImages.length} images on page`);
    
    for (const img of allImages) {
      const src = img.src || '';
      const srcSet = img.srcset || '';
      
      // Check if image source ends with -inside.png
      if (src.endsWith('-inside.png') || srcSet.includes('-inside.png')) {
        console.log('✅ Found -inside.png image:', src);
        
        // Check if this image is visible and in viewport
        const rect = img.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          console.log('✅ Image is visible and in viewport');
          
          // Check if image is clickable/interactable
          if (isElementInteractable(img)) {
            console.log('✅ Image is interactable, returning as reward target');
            return img;
          } else {
            // Try to find parent container that might be clickable
            let parent = img.parentElement;
            let depth = 0;
            while (parent && parent !== document.body && depth < 5) {
              if (isElementInteractable(parent)) {
                console.log('✅ Found clickable parent for -inside.png image:', parent);
                return parent;
              }
              parent = parent.parentElement;
              depth++;
            }
            
            // If no clickable parent found, try the image anyway
            console.log('⚠️ No clickable parent found, but returning image anyway');
            return img;
          }
        } else {
          console.log('⚠️ Image found but not visible:', {width: rect.width, height: rect.height});
        }
      }
    }
    
    console.log('❌ No -inside.png images found, falling back to old method...');
    
    // FALLBACK: Use old method if no -inside.png found
    return findRewardButtonFallback();
    
  } catch (error) {
    console.error('❌ Error finding -inside.png images:', error);
    return findRewardButtonFallback();
  }
}

// Fallback method (old logic)
function findRewardButtonFallback() {
  // Try jQuery-style selectors first
  try {
    // Method 1: Look for buttons containing reward text
    const buttons = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"], a'));
    
    for (const button of buttons) {
      const text = (button.textContent || button.value || '').toLowerCase().trim();
      const title = (button.title || '').toLowerCase().trim();
      
      // Improved reward detection with multiple patterns
      const rewardPatterns = [
        'nhận thưởng',
        'nhận thường', // typo variation
        'nhan thuong', // no diacritics
        'collect reward',
        'get reward',
        'claim reward'
      ];
      
      let isRewardButton = false;
      
      // Check exact match first
      for (const pattern of rewardPatterns) {
        if (text.includes(pattern) || title.includes(pattern)) {
          isRewardButton = true;
          break;
        }
      }
      
      // Fallback: check if contains both "nhận" and "thưởng" (any order)
      if (!isRewardButton && 
          (text.includes('nhận') || text.includes('nhan')) && 
          (text.includes('thưởng') || text.includes('thuong'))) {
        isRewardButton = true;
      }
      
      if (isRewardButton && isElementInteractable(button)) {
        console.log('✅ Found reward button by text:', button.textContent, button);
        return button;
      }
    }
    
    // Method 2: Try CSS selectors
    for (const selector of REWARD_BUTTON_SELECTORS) {
      // Skip jQuery-style selectors for now
      if (selector.includes(':contains')) continue;
      
      const button = document.querySelector(selector);
      if (button && isElementInteractable(button)) {
        console.log('✅ Found reward button by selector:', selector, button);
        return button;
      }
    }
    
    // Method 3: Look for mining-related buttons
    const miningButtons = document.querySelectorAll('[class*="mining"], [id*="mining"], [class*="reward"], [id*="reward"]');
    for (const button of miningButtons) {
      if (isElementInteractable(button)) {
        console.log('✅ Found potential reward button:', button);
        return button;
      }
    }
    
  } catch (error) {
    console.error('❌ Error finding reward button:', error);
  }
  
  return null;
}

// Check if reward is available for collection
function checkRewardAvailable() {
  try {
    // Look for indicators that reward is ready
    const rewardButton = findRewardButton();
    
    if (!rewardButton) return false;
    
    // Check if button is enabled
    if (rewardButton.disabled) return false;
    
    // Check for specific reward-ready indicators
    const indicators = [
      // Button text indicates ready
      /nhận.*thưởng/i.test(rewardButton.textContent || rewardButton.value || ''),
      
      // Button doesn't have disabled classes
      !rewardButton.classList.contains('disabled'),
      !rewardButton.classList.contains('btn-disabled'),
      
      // No countdown timers visible
      !document.querySelector('.countdown, .timer, [class*="countdown"]')
    ];
    
    return indicators.every(indicator => indicator);
    
  } catch (error) {
    console.error('❌ Error checking reward availability:', error);
    return false;
  }
}

// Click reward button with multiple methods - NEW FLOW
async function clickRewardButton(element) {
  try {
    console.log('🖱️ Starting click process for element:', element.tagName);
    
    // Check if this is an -inside.png image (new flow)
    if (element.tagName === 'IMG' && (element.src.endsWith('-inside.png') || element.srcset.includes('-inside.png'))) {
      console.log('🎯 Detected -inside.png image, using new flow...');
      return await clickInsideImageFlow(element);
    }
    
    // Otherwise use original flow for direct reward buttons
    console.log('🔄 Using original flow for direct reward button...');
    return await clickDirectRewardButton(element);
    
  } catch (error) {
    console.error('❌ Error in clickRewardButton:', error);
    return { success: false, error: error.message };
  }
}

// NEW: Handle clicking -inside.png image and finding popup reward button
async function clickInsideImageFlow(image) {
  try {
    console.log('�️ Step 1: Clicking -inside.png image...');
    
    // Click the -inside.png image
    const clickResult = await performClick(image);
    if (!clickResult.success) {
      return { success: false, error: 'Failed to click -inside.png image' };
    }
    
    console.log('✅ -inside.png image clicked, waiting for popup...');
    
    // Wait for popup to appear
    await sleep(1500);
    
    console.log('🔍 Step 2: Looking for "Nhận Thưởng" button in popup...');
    
    // Look for "Nhận Thưởng" button in popup/modal
    const popupRewardButton = await findPopupRewardButton();
    
    if (!popupRewardButton) {
      return { success: false, error: 'Popup appeared but no "Nhận Thưởng" button found' };
    }
    
    console.log('✅ Found "Nhận Thưởng" button in popup:', popupRewardButton);
    
    // Wait a bit more and click the reward button
    await sleep(500);
    console.log('�🖱️ Step 3: Clicking "Nhận Thưởng" button...');
    
    const rewardClickResult = await performClick(popupRewardButton);
    if (!rewardClickResult.success) {
      return { success: false, error: 'Failed to click "Nhận Thưởng" button in popup' };
    }
    
    console.log('✅ Successfully completed new reward collection flow!');
    return { success: true, method: 'inside-image-popup-flow' };
    
  } catch (error) {
    console.error('❌ Error in clickInsideImageFlow:', error);
    return { success: false, error: error.message };
  }
}

// Find "Nhận Thưởng" button in popup/modal
async function findPopupRewardButton() {
  try {
    // Wait and check multiple times for popup to fully load
    for (let attempt = 0; attempt < 5; attempt++) {
      console.log(`🔍 Attempt ${attempt + 1}: Looking for popup reward button...`);
      
      // Look for buttons with "Nhận Thưởng" text
      const allButtons = document.querySelectorAll('button, input[type="button"], input[type="submit"], a, div[onclick], span[onclick]');
      
      for (const button of allButtons) {
        const text = (button.textContent || button.value || '').toLowerCase().trim();
        const title = (button.title || '').toLowerCase().trim();
        
        // Check for reward text patterns
        const rewardPatterns = [
          'nhận thưởng',
          'nhận thường',
          'nhan thuong',
          'collect reward',
          'get reward',
          'claim reward'
        ];
        
        for (const pattern of rewardPatterns) {
          if (text.includes(pattern) || title.includes(pattern)) {
            // Additional check: make sure this button is visible and in a popup/modal
            const rect = button.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              console.log('✅ Found popup reward button:', text, button);
              return button;
            }
          }
        }
      }
      
      // Wait before next attempt
      await sleep(300);
    }
    
    console.log('❌ No popup reward button found after 5 attempts');
    return null;
    
  } catch (error) {
    console.error('❌ Error finding popup reward button:', error);
    return null;
  }
}

// Original flow for direct reward buttons
async function clickDirectRewardButton(button) {
  try {
    console.log('🖱️ Attempting to click reward button directly...');
    return await performClick(button);
  } catch (error) {
    console.error('❌ Error clicking direct reward button:', error);
    return { success: false, error: error.message };
  }
}

// Unified click performer with multiple methods
async function performClick(element) {
  try {
    // Method 1: Direct click
    try {
      element.click();
      console.log('✅ Direct click successful');
      return { success: true, method: 'direct' };
    } catch (error) {
      console.log('⚠️ Direct click failed:', error.message);
    }
    
    // Method 2: Mouse event
    try {
      const rect = element.getBoundingClientRect();
      const event = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2
      });
      
      element.dispatchEvent(event);
      console.log('✅ Mouse event click successful');
      return { success: true, method: 'mouseEvent' };
    } catch (error) {
      console.log('⚠️ Mouse event click failed:', error.message);
    }
    
    // Method 3: Focus and Enter key (for buttons only)
    if (element.tagName === 'BUTTON' || element.tagName === 'INPUT') {
      try {
        element.focus();
        await sleep(100);
        
        const enterEvent = new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          bubbles: true
        });
        
        element.dispatchEvent(enterEvent);
        console.log('✅ Enter key press successful');
        return { success: true, method: 'keyboard' };
      } catch (error) {
        console.log('⚠️ Enter key press failed:', error.message);
      }
    }
    
    return { success: false, error: 'All click methods failed' };
    
  } catch (error) {
    console.error('❌ Error performing click:', error);
    return { success: false, error: error.message };
  }
}

// Verify that reward was collected successfully
async function verifyRewardCollection() {
  try {
    console.log('🔍 Verifying reward collection...');
    
    // Wait for potential page updates
    await sleep(1000);
    
    // Check for success indicators
    const successIndicators = [
      // Success messages
      document.querySelector('.success, .alert-success, [class*="success"]'),
      
      // Reward counter increased
      document.querySelector('.reward-count, .total-rewards, [class*="reward"]'),
      
      // Button state changed (disabled or text changed)
      (() => {
        const button = findRewardButton();
        return button && (button.disabled || 
                         /đã.*nhận|received|completed/i.test(button.textContent || ''));
      })(),
      
      // No error messages
      !document.querySelector('.error, .alert-error, [class*="error"]')
    ];
    
    const hasSuccessIndicator = successIndicators.some(indicator => indicator);
    
    if (hasSuccessIndicator) {
      return { 
        success: true, 
        data: {
          indicators: successIndicators.map(i => !!i),
          timestamp: Date.now()
        }
      };
    } else {
      return { 
        success: false, 
        error: 'Không tìm thấy dấu hiệu nhận thưởng thành công' 
      };
    }
    
  } catch (error) {
    console.error('❌ Error verifying reward collection:', error);
    return { success: false, error: error.message };
  }
}

// Get mining information from page
function getMiningInfo() {
  try {
    const info = {};
    
    // Look for mining status elements
    for (const selector of MINING_INDICATORS) {
      const element = document.querySelector(selector);
      if (element) {
        info.status = element.textContent || element.innerText;
        break;
      }
    }
    
    // Look for character name
    const characterElement = document.querySelector('.character-name, .player-name, [class*="character"]');
    if (characterElement) {
      info.character = characterElement.textContent || characterElement.innerText;
    }
    
    // Look for mine type/name
    const mineElement = document.querySelector('.mine-name, .current-mine, [class*="mine"]');
    if (mineElement) {
      info.mine = mineElement.textContent || mineElement.innerText;
    }
    
    return info;
    
  } catch (error) {
    console.error('❌ Error getting mining info:', error);
    return {};
  }
}

// Helper function to check if element is interactable
function isElementInteractable(element) {
  if (!element) return false;
  
  // Check visibility
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return false;
  }
  
  // Check if element is in viewport
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    return false;
  }
  
  return true;
}

// Helper function to scroll element into view
function scrollToElement(element) {
  try {
    element.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center', 
      inline: 'center' 
    });
  } catch (error) {
    console.error('❌ Error scrolling to element:', error);
  }
}

// Helper function to sleep
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Handle page unload
window.addEventListener('beforeunload', () => {
  try {
    if (pageMonitorInterval) {
      clearInterval(pageMonitorInterval);
    }
    isContentScriptActive = false;
    console.log('🔄 Content script cleaned up before unload');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
});

// Handle page visibility change
document.addEventListener('visibilitychange', () => {
  try {
    console.log('👁️ Page visibility changed:', document.visibilityState);
    
    if (document.visibilityState === 'visible' && !isContentScriptActive) {
      console.log('🔄 Page became visible, checking if reinitialization needed...');
      setTimeout(safeInitialize, 1000);
    }
  } catch (error) {
    console.error('❌ Error handling visibility change:', error);
  }
});

// Enhanced initialization - multiple entry points
function startInitialization() {
  console.log('🏔️ HH3D Khoáng Mạch Content Script Loading...');
  
  // Try immediate initialization
  safeInitialize();
  
  // Also try when DOM is fully loaded (backup)
  if (document.readyState !== 'complete') {
    window.addEventListener('load', () => {
      if (!isContentScriptActive) {
        console.log('🔄 Window loaded, trying initialization again...');
        setTimeout(safeInitialize, 500);
      }
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startInitialization);
} else {
  startInitialization();
}

console.log('🏔️ HH3D Khoáng Mạch Content Script Module Loaded');

// DEBUG: Test function for manual testing
window.testRewardCollection = async function() {
  console.log('🧪 MANUAL TEST: Starting reward collection...');
  try {
    await handleRewardCollection();
    console.log('✅ MANUAL TEST: Reward collection completed successfully');
  } catch (error) {
    console.error('❌ MANUAL TEST FAILED:', error);
  }
};

// DEBUG: Test refresh button click
window.testRefreshButton = async function() {
  console.log('🧪 MANUAL TEST: Testing refresh button click...');
  try {
    const result = await clickRefreshButton();
    console.log('🧪 REFRESH BUTTON TEST RESULT:', result);
  } catch (error) {
    console.error('❌ REFRESH BUTTON TEST FAILED:', error);
  }
};

// DEBUG: Test reward button finding
window.testFindRewardButton = function() {
  console.log('🧪 MANUAL TEST: Testing reward button finding...');
  try {
    const rewardButton = findRewardButton();
    console.log('🧪 REWARD BUTTON FOUND:', rewardButton);
    return rewardButton;
  } catch (error) {
    console.error('❌ REWARD BUTTON TEST FAILED:', error);
  }
};

// DEBUG: Manual trigger alarm (for testing countdown completion)
window.debugTriggerAlarm = async function() {
  console.log('🧪 MANUAL TEST: Triggering reward collection (simulating alarm)...');
  try {
    await chrome.runtime.sendMessage({action: 'debug_trigger_reward'});
    console.log('✅ Manual alarm trigger sent to background');
  } catch (error) {
    console.error('❌ MANUAL ALARM TRIGGER FAILED:', error);
  }
};

// DEBUG: Check if content script is active
window.checkContentScript = function() {
  console.log('🧪 CONTENT SCRIPT STATUS CHECK:');
  console.log('  - Script Active:', isContentScriptActive);
  console.log('  - URL:', window.location.href);
  console.log('  - Is KhoangMach Page:', isKhoangMachPage());
  console.log('  - Chrome Runtime:', !!chrome.runtime);
  console.log('  - Chrome Extension ID:', chrome.runtime?.id);
  
  // Test basic functionality
  try {
    console.log('  - Can find reward button:', !!findRewardButton());
  } catch (e) {
    console.log('  - Error finding reward button:', e.message);
  }
  
  // Force reinitialization if needed
  if (!isContentScriptActive) {
    console.log('🔄 Content script not active, attempting reinitialization...');
    safeInitialize();
  }
  
  return {
    active: isContentScriptActive,
    url: window.location.href,
    isKhoangMachPage: isKhoangMachPage(),
    chromeRuntime: !!chrome.runtime
  };
};

// DEBUG: Force content script activation
window.forceActivateContentScript = function() {
  console.log('🔧 FORCE ACTIVATING CONTENT SCRIPT...');
  isContentScriptActive = false; // Reset state
  safeInitialize(); // Reinitialize
  
  // Also setup debug functions globally
  window.debugFunctions = {
    triggerAlarm: window.debugTriggerAlarm,
    testReward: window.testRewardCollection,
    testRefresh: window.testRefreshButton,
    testFind: window.testFindRewardButton,
    checkScript: window.checkContentScript,
    forceActivate: window.forceActivateContentScript
  };
  
  console.log('✅ Content script force activation complete');
  console.log('💡 Available debug functions: window.debugFunctions');
};

// DEBUG: Check extension state
window.debugExtensionState = async function() {
  console.log('🧪 MANUAL TEST: Checking extension state...');
  try {
    const response = await chrome.runtime.sendMessage({action: 'debug_extension'});
    console.log('🧪 EXTENSION STATE:', response);
    return response;
  } catch (error) {
    console.error('❌ EXTENSION STATE CHECK FAILED:', error);
  }
};

// DEBUG: Test full reward collection flow
window.testFullFlow = async function() {
  console.log('🧪 MANUAL TEST: Testing full reward collection flow...');
  try {
    console.log('Step 1: Testing refresh button...');
    const refreshResult = await clickRefreshButton();
    console.log('Refresh result:', refreshResult);
    
    await sleep(2000);
    
    console.log('Step 2: Finding reward target...');
    const rewardTarget = findRewardButton();
    console.log('Reward target found:', rewardTarget);
    
    if (rewardTarget) {
      console.log('Step 3: Testing reward collection...');
      await handleRewardCollection();
    } else {
      console.log('❌ No reward target found');
    }
  } catch (error) {
    console.error('❌ FULL FLOW TEST FAILED:', error);
  }
};

// DEBUG: Check if content script is receiving messages
window.testMessageReceiving = function() {
  console.log('🧪 MANUAL TEST: Testing message receiving...');
  
  // Override handleMessage to add more logging
  const originalHandleMessage = handleMessage;
  window.originalHandleMessage = originalHandleMessage;
  
  window.handleMessage = function(message, sender, sendResponse) {
    console.log('🧪 DEBUG: Message received in override:', message);
    return originalHandleMessage(message, sender, sendResponse);
  };
  
  // Re-setup listener with override
  chrome.runtime.onMessage.removeListener(originalHandleMessage);
  chrome.runtime.onMessage.addListener(window.handleMessage);
  
  console.log('✅ Message receiving test setup complete. Check console for messages.');
};

// DEBUG: Test function to find images
window.findInsideImages = function() {
  console.log('🔍 MANUAL TEST: Looking for -inside.png images...');
  const allImages = document.querySelectorAll('img');
  const insideImages = [];
  
  allImages.forEach(img => {
    if (img.src.endsWith('-inside.png') || img.srcset.includes('-inside.png')) {
      insideImages.push({
        src: img.src,
        element: img,
        visible: img.getBoundingClientRect().width > 0
      });
    }
  });
  
  console.log('Found -inside.png images:', insideImages);
  return insideImages;
};

// Enhanced initialization with error handling
function safeInitialize() {
  try {
    console.log('🔄 Safe initialization starting...');
    console.log('🔍 Extension context check:', {
      chromeRuntime: !!chrome.runtime,
      extensionId: chrome.runtime?.id,
      url: window.location.href,
      readyState: document.readyState
    });
    
    // Check if extension context is valid
    if (!chrome.runtime || !chrome.runtime.id) {
      console.log('❌ Extension context invalid, skipping initialization');
      return;
    }
    
    initializeContentScript();
    
    // Add global indicators for debugging
    window.hh3dContentScriptLoaded = true;
    window.hh3dContentScriptVersion = '2.0-' + Date.now();
    
    console.log('✅ Content script safe initialization completed');
    
  } catch (error) {
    console.error('❌ Error during safe initialization:', error);
    
    // Retry initialization after delay
    setTimeout(() => {
      console.log('🔄 Retrying initialization...');
      safeInitialize();
    }, 2000);
  }
}
