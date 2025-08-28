// Content Script - Monitors game state and performs auto actions
class BossMonitor {
  constructor() {
    this.isEnabled = false;
    this.isTestMode = this.detectTestMode();
    this.monitorInterval = null;
    this.countdownInterval = null;
    this.gameState = {
      status: 'unknown',
      timeLeft: 0,
      attacksLeft: 5,
      canChallenge: false,
      bossName: '',
      lastUpdate: Date.now()
    };
    
    console.log(`[Boss Helper] Initialized in ${this.isTestMode ? 'TEST' : 'PROD'} mode`);
  }

  // Detect if running in test mode (local file)
  detectTestMode() {
    const isTest = window.location.protocol === 'file:' || 
                   window.location.href.includes('mock-bicanh.html') ||
                   window.location.href.includes('mock-boss.html');
    console.log(`[Boss Helper] URL detected: ${window.location.href}`);
    return isTest;
  }

  // Get game elements based on mode
  detectGameElements() {
    const elements = {
      challengeBtn: document.getElementById('challenge-boss-btn'),
      attackBtn: document.getElementById('attack-boss-btn'),
      attackCount: document.querySelector('.attack-count'),
      bossPopup: document.getElementById('boss-damage-screen'),
      backBtn: document.getElementById('back-button'),
      bossName: document.querySelector('.boss-name'),
      bossTimer: document.getElementById('boss-timer-text')
    };

    // In production mode, try alternative selectors if standard ones fail
    if (!this.isTestMode) {
      // Try to find challenge button with more generic selectors
      if (!elements.challengeBtn) {
        const challengeSelectors = [
          'button:contains("KHIÊU CHIẾN")',
          'button:contains("Khiêu Chiến")', 
          'button:contains("KHIEU CHIEN")',
          '.challenge-btn',
          '.btn-challenge'
        ];
        
        for (let selector of challengeSelectors) {
          if (selector.includes(':contains')) {
            const buttons = document.querySelectorAll('button');
            for (let btn of buttons) {
              const text = btn.textContent.trim().toUpperCase();
              if (text.includes('KHIÊU CHIẾN') || text.includes('KHIEU CHIEN')) {
                elements.challengeBtn = btn;
                break;
              }
            }
          } else {
            elements.challengeBtn = document.querySelector(selector);
          }
          if (elements.challengeBtn) break;
        }
      }

      // Try to find attack button with alternative selectors
      if (!elements.attackBtn) {
        const attackSelectors = [
          '.attack-button', // Your actual class name
          '.attack-btn',
          '.btn-attack'
        ];
        
        for (let selector of attackSelectors) {
          elements.attackBtn = document.querySelector(selector);
          if (elements.attackBtn) {
            console.log(`[Boss Helper] Found attack button with selector: ${selector}`);
            break;
          }
        }
      }

      // Try to find popup with more generic selectors
      if (!elements.bossPopup) {
        const popupSelectors = [
          '.battle-popup',
          '.popup-overlay',
          '.modal',
          '.boss-battle',
          '[style*="display: block"]'
        ];
        
        for (let selector of popupSelectors) {
          elements.bossPopup = document.querySelector(selector);
          if (elements.bossPopup) break;
        }
      }
    }

    // Log detected elements for debugging
    const detected = Object.keys(elements).filter(key => elements[key]);
    console.log(`[Boss Helper] Detected elements: ${detected.join(', ')}`);
    
    return elements;
  }

  // Parse countdown timer from button text
  parseCountdown(timerText) {
    // Handle different timer formats
    const patterns = [
      /Còn\s+(\d+):(\d+)/,  // "Còn 5:30"
      /(\d+):(\d+):(\d+)/,   // "5:30:25" 
      /(\d+):(\d+)/          // "5:30"
    ];

    for (const pattern of patterns) {
      const match = timerText.match(pattern);
      if (match) {
        if (match.length === 4) {
          // HH:MM:SS format
          return parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3]);
        } else if (match.length === 3) {
          // MM:SS format
          return parseInt(match[1]) * 60 + parseInt(match[2]);
        }
      }
    }
    return 0;
  }

  // Monitor game state changes
  monitorGameState() {
    try {
      const oldState = { ...this.gameState };
      
      // If we're in manual countdown, don't override with page state
      if (this.countdownInterval && this.gameState.timeLeft > 0) {
        // Keep current countdown state, just update last update time
        this.gameState.lastUpdate = Date.now();
        return;
      }
      
      // Find challenge button
      const challengeBtn = this.findChallengeButton();
      
      if (challengeBtn) {
        const btnText = challengeBtn.textContent.trim();
        const isDisabled = challengeBtn.disabled || 
                          challengeBtn.classList.contains('disabled');
        
        if (btnText.includes('Còn') && isDisabled) {
          // Page countdown state - only use if we don't have manual countdown
          if (!this.countdownInterval) {
            this.gameState.status = 'countdown';
            this.gameState.timeLeft = this.parseCountdown(btnText);
            this.gameState.canChallenge = false;
          }
          
        } else if ((btnText.includes('KHIÊU CHIẾN') || btnText.includes('Khiêu chiến')) && !isDisabled) {
          // Ready to challenge - only if not in manual countdown
          if (!this.countdownInterval) {
            this.gameState.status = 'ready';
            this.gameState.timeLeft = 0;
            this.gameState.canChallenge = true;
          }
          
        } else if (btnText.includes('Hết Lượt')) {
          // No attacks left
          this.gameState.status = 'depleted';
          this.gameState.timeLeft = 0;
          this.gameState.canChallenge = false;
          
        } else {
          // Unknown state - keep current state if in countdown
          if (!this.countdownInterval) {
            this.gameState.status = 'unknown';
            this.gameState.canChallenge = false;
          }
        }
      } else {
        // No challenge button found - keep current state if in countdown
        if (!this.countdownInterval) {
          this.gameState.status = 'unknown';
          this.gameState.canChallenge = false;
        }
      }

      // Try to get boss name from page
      const bossNameElements = [
        document.querySelector('.boss-name'),
        document.querySelector('[class*="boss"]'),
        document.querySelector('h1'),
        document.querySelector('h2')
      ].filter(el => el !== null);
      
      for (let el of bossNameElements) {
        const text = el.textContent.trim();
        if (text && text.length > 0 && text.length < 50) {
          this.gameState.bossName = text;
          break;
        }
      }

      // Try to get attack count
      const attackCountElements = [
        document.querySelector('.attack-count'),
        document.querySelector('[class*="attack"]'),
        document.querySelector('[class*="count"]')
      ].filter(el => el !== null);
      
      for (let el of attackCountElements) {
        const text = el.textContent.trim();
        const attackNum = parseInt(text);
        if (!isNaN(attackNum) && attackNum >= 0 && attackNum <= 10) {
          this.gameState.attacksLeft = attackNum;
          break;
        }
      }

      this.gameState.lastUpdate = Date.now();

      // Send state to background if changed
      if (JSON.stringify(oldState) !== JSON.stringify(this.gameState)) {
        chrome.runtime.sendMessage({
          type: 'STATE_UPDATE',
          state: this.gameState
        }).catch(err => {
          console.log('[Boss Helper] Failed to send state update:', err);
        });
      }

    } catch (error) {
      console.error('[Boss Helper] Error monitoring state:', error);
    }
  }

  // Auto challenge when ready
  async autoChallenge() {
    // Don't challenge if not enabled, can't challenge, or countdown is still running
    if (!this.isEnabled || 
        !this.gameState.canChallenge || 
        this.gameState.status !== 'ready' ||
        this.countdownInterval !== null) {
      return;
    }

    try {
      // Look for "KHIÊU CHIẾN" button more precisely
      const challengeBtn = this.findChallengeButton();
      
      if (challengeBtn && 
          !challengeBtn.disabled && 
          !challengeBtn.classList.contains('disabled')) {
        
        console.log('[Boss Helper] Auto challenging boss...');
        challengeBtn.click();
        
        // Set state to prevent multiple clicks
        this.gameState.canChallenge = false;
        this.gameState.status = 'challenging';
        
        // Send notification about auto challenge
        chrome.runtime.sendMessage({
          type: 'AUTO_ACTION',
          action: 'challenge',
          timestamp: Date.now()
        }).catch(err => console.log('[Boss Helper] Notification failed:', err));
        
        // Wait for popup to load, then auto attack
        this.waitForPopupAndAttack();
      }
    } catch (error) {
      console.error('[Boss Helper] Error in auto challenge:', error);
    }
  }

  // Find the challenge button with "KHIÊU CHIẾN" text
  findChallengeButton() {
    // Look for button with specific HTML structure you provided
    const battleButton = document.getElementById('battle-button');
    if (battleButton && battleButton.textContent.includes('Khiêu chiến')) {
      return battleButton;
    }

    // Fallback: search all buttons for "KHIÊU CHIẾN" text
    const buttons = document.querySelectorAll('button');
    for (let btn of buttons) {
      const text = btn.textContent.trim();
      if (text.includes('KHIÊU CHIẾN') || text.includes('Khiêu chiến')) {
        console.log('[Boss Helper] Found challenge button:', text);
        return btn;
      }
    }

    console.log('[Boss Helper] Challenge button not found');
    return null;
  }

  // Wait for popup to load and then attack
  waitForPopupAndAttack() {
    if (!this.isEnabled) return;

    console.log('[Boss Helper] Waiting for popup to load...');
    
    // Check every 200ms for popup to appear, max 15 seconds
    let attempts = 0;
    const maxAttempts = 75; // 15 seconds / 200ms
    
    const checkPopup = setInterval(() => {
      attempts++;
      
      // Check if popup is visible by looking for any visible popup/modal elements
      const possiblePopups = [
        document.querySelector('.popup-overlay'),
        document.querySelector('.modal'),
        document.querySelector('.battle-popup'),
        document.querySelector('[style*="display: block"]'),
        document.querySelector('[class*="popup"][style*="block"]'),
        document.querySelector('[class*="modal"][style*="block"]')
      ].filter(el => el !== null);

      let popupFound = false;
      for (let popup of possiblePopups) {
        const style = window.getComputedStyle(popup);
        if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
          popupFound = true;
          console.log('[Boss Helper] Popup detected:', popup.className || popup.tagName);
          break;
        }
      }
      
      if (popupFound) {
        console.log('[Boss Helper] Popup fully loaded, looking for attack button...');
        clearInterval(checkPopup);
        
        // Wait a bit more for popup content to be fully rendered
        setTimeout(() => {
          this.autoAttack();
        }, 1000); // Wait 1s for popup content to load
        
      } else if (attempts >= maxAttempts) {
        console.log('[Boss Helper] Popup load timeout after', attempts * 0.2, 'seconds');
        clearInterval(checkPopup);
      } else {
        if (attempts % 10 === 0) { // Log every 2 seconds
          console.log(`[Boss Helper] Waiting for popup... attempt ${attempts}/${maxAttempts}`);
        }
      }
    }, 200);
  }

  // Auto attack in popup
  async autoAttack() {
    if (!this.isEnabled) return;

    try {
      console.log('[Boss Helper] Looking for attack button in popup...');
      
      // Look for the specific attack button with "⚔️Tấn Công" text
      const attackBtn = this.findAttackButton();
      
      if (attackBtn && !attackBtn.disabled && !attackBtn.classList.contains('disabled')) {
        console.log('[Boss Helper] Auto attacking boss...');
        attackBtn.click();
        
        // Update attack count
        await this.updateAttackCount();
        
        // Send notification about auto attack
        chrome.runtime.sendMessage({
          type: 'AUTO_ACTION',
          action: 'attack',
          timestamp: Date.now()
        }).catch(err => console.log('[Boss Helper] Notification failed:', err));
        
        // Wait 2 seconds then look for back button
        setTimeout(() => {
          this.autoClickBackButton();
        }, 2000);
        
      } else {
        console.log('[Boss Helper] Attack button not available');
        this.logAllButtonsInPopup();
      }
    } catch (error) {
      console.error('[Boss Helper] Error in auto attack:', error);
    }
  }

  // Find attack button with "⚔️Tấn Công" text
  findAttackButton() {
    // Look for button with specific onclick="attackBoss()"
    const buttons = document.querySelectorAll('button');
    for (let btn of buttons) {
      const onclick = btn.getAttribute('onclick');
      const text = btn.textContent.trim();
      
      // Check for specific onclick or text content
      if (onclick === 'attackBoss()' || 
          text.includes('⚔️Tấn Công') || 
          text.includes('Tấn Công') ||
          text.includes('TẤN CÔNG')) {
        console.log('[Boss Helper] Found attack button:', text);
        return btn;
      }
    }
    
    // Fallback: try by class name
    const attackBtnByClass = document.querySelector('.attack-button');
    if (attackBtnByClass) {
      console.log('[Boss Helper] Found attack button by class');
      return attackBtnByClass;
    }

    console.log('[Boss Helper] Attack button not found');
    return null;
  }

  // Auto click back button after attack
  async autoClickBackButton() {
    if (!this.isEnabled) return;

    try {
      console.log('[Boss Helper] Looking for back button...');
      
      const backBtn = this.findBackButton();
      
      if (backBtn && !backBtn.disabled && !backBtn.classList.contains('disabled')) {
        console.log('[Boss Helper] Auto clicking back button...');
        backBtn.click();
        
        // Send notification about back action
        chrome.runtime.sendMessage({
          type: 'AUTO_ACTION',
          action: 'back',
          timestamp: Date.now()
        }).catch(err => console.log('[Boss Helper] Notification failed:', err));
        
        // Start 20-minute countdown
        this.startCountdown();
        
      } else {
        console.log('[Boss Helper] Back button not available');
        this.logAllButtonsInPopup();
      }
    } catch (error) {
      console.error('[Boss Helper] Error in auto back:', error);
    }
  }

  // Find back button with "Trở lại" text
  findBackButton() {
    const buttons = document.querySelectorAll('button');
    for (let btn of buttons) {
      const onclick = btn.getAttribute('onclick');
      const text = btn.textContent.trim();
      
      // Check for specific onclick or text content
      if (onclick === 'endBattle()' || 
          text.includes('Trở lại') || 
          text.includes('TRỞ LẠI') ||
          text.includes('Back')) {
        console.log('[Boss Helper] Found back button:', text);
        return btn;
      }
    }
    
    // Fallback: try by class name
    const backBtnByClass = document.querySelector('.back-button');
    if (backBtnByClass) {
      console.log('[Boss Helper] Found back button by class');
      return backBtnByClass;
    }

    console.log('[Boss Helper] Back button not found');
    return null;
  }

  // Start 20-minute countdown (or shorter for test mode)
  startCountdown() {
    // Use shorter countdown in test mode for easier testing
    const countdownMinutes = this.isTestMode ? 0.5 : 20; // 30 seconds for test, 20 minutes for prod
    const countdownSeconds = countdownMinutes * 60;
    
    console.log(`[Boss Helper] Starting ${countdownMinutes}-minute countdown...`);
    
    // Set countdown state
    this.gameState.status = 'countdown';
    this.gameState.timeLeft = countdownSeconds;
    this.gameState.canChallenge = false;
    
    // Update state immediately
    chrome.runtime.sendMessage({
      type: 'STATE_UPDATE',
      state: this.gameState
    }).catch(err => console.log('[Boss Helper] Failed to send state update:', err));
    
    // Start countdown timer
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    
    this.countdownInterval = setInterval(() => {
      this.gameState.timeLeft--;
      
      if (this.gameState.timeLeft <= 0) {
        // Countdown finished
        this.gameState.status = 'ready';
        this.gameState.timeLeft = 0;
        
        // Check if we still have attacks left
        if (this.gameState.attacksLeft > 0) {
          this.gameState.canChallenge = true;
          console.log(`[Boss Helper] Countdown finished! Ready to challenge again. Attacks left: ${this.gameState.attacksLeft}`);
          
          // Send notification that we're ready for next attack
          chrome.runtime.sendMessage({
            type: 'AUTO_ACTION',
            action: 'ready_next_attack',
            attacksLeft: this.gameState.attacksLeft,
            timestamp: Date.now()
          }).catch(err => console.log('[Boss Helper] Notification failed:', err));
          
          // Send state update immediately so monitoring can detect ready state
          chrome.runtime.sendMessage({
            type: 'STATE_UPDATE',
            state: this.gameState
          }).catch(err => console.log('[Boss Helper] Failed to send state update:', err));
          
        } else {
          // No attacks left for today
          this.gameState.canChallenge = false;
          this.gameState.status = 'depleted';
          console.log('[Boss Helper] Countdown finished but no attacks left for today.');
          
          // Send notification that all attacks are done
          chrome.runtime.sendMessage({
            type: 'AUTO_ACTION',
            action: 'all_attacks_completed',
            timestamp: Date.now()
          }).catch(err => console.log('[Boss Helper] Notification failed:', err));
        }
        
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
      }
      
      // Send state update every 10 seconds to reduce message frequency
      if (this.gameState.timeLeft % 10 === 0) {
        chrome.runtime.sendMessage({
          type: 'STATE_UPDATE',
          state: this.gameState
        }).catch(err => {});
      }
    }, 1000);
    
    // Send notification about countdown start
    const attackNumber = 6 - this.gameState.attacksLeft; // Current attack number (1-5)
    chrome.runtime.sendMessage({
      type: 'AUTO_ACTION',
      action: 'countdown_start',
      attackNumber: attackNumber,
      attacksLeft: this.gameState.attacksLeft,
      timestamp: Date.now()
    }).catch(err => console.log('[Boss Helper] Notification failed:', err));
  }

  // Log all buttons in popup for debugging
  logAllButtonsInPopup() {
    const allButtons = document.querySelectorAll('button');
    console.log('[Boss Helper] All buttons found:', 
      Array.from(allButtons).map(btn => ({
        text: btn.textContent.trim(),
        className: btn.className,
        id: btn.id,
        onclick: btn.getAttribute('onclick')
      }))
    );
  }

  // Update attack count after attack
  async updateAttackCount() {
    try {
      const currentCount = this.gameState.attacksLeft || 5;
      const newCount = Math.max(0, currentCount - 1);
      
      this.gameState.attacksLeft = newCount;
      
      console.log(`[Boss Helper] Attack count updated: ${newCount}/5`);
      
      // Store in chrome storage
      await chrome.storage.sync.set({
        [`attacksLeft_${new Date().toDateString()}`]: newCount
      });
      
      // If no attacks left, disable auto-challenge
      if (newCount <= 0) {
        this.gameState.status = 'depleted';
        this.gameState.canChallenge = false;
        console.log('[Boss Helper] No attacks left for today');
      }
      
    } catch (error) {
      console.error('[Boss Helper] Error updating attack count:', error);
    }
  }

  // Start monitoring
  start() {
    this.isEnabled = true;
    console.log('[Boss Helper] Monitoring started');
    
    // Monitor every second
    this.monitorInterval = setInterval(() => {
      this.monitorGameState();
      
      // Only auto challenge if enabled, can challenge, and not in countdown
      if (this.isEnabled && 
          this.gameState.canChallenge && 
          this.gameState.status === 'ready' && 
          !this.countdownInterval) { // Don't challenge if countdown is running
        this.autoChallenge();
      }
    }, 1000);

    // Initial state check
    this.monitorGameState();
  }

  // Stop monitoring
  stop() {
    this.isEnabled = false;
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
    console.log('[Boss Helper] Monitoring stopped');
  }

  // Get current state
  getState() {
    return this.gameState;
  }
}

// Initialize monitor
const bossMonitor = new BossMonitor();

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    switch (request.type) {
      case 'START_MONITORING':
        bossMonitor.start();
        sendResponse({ success: true });
        break;
        
      case 'STOP_MONITORING':
        bossMonitor.stop();
        sendResponse({ success: true });
        break;
        
      case 'GET_STATE':
        sendResponse(bossMonitor.getState());
        break;
        
      case 'HEALTH_CHECK':
        sendResponse({ 
          alive: true, 
          mode: bossMonitor.isTestMode ? 'TEST' : 'PROD',
          url: window.location.href 
        });
        break;
        
      default:
        sendResponse({ error: 'Unknown message type' });
    }
  } catch (error) {
    console.error('[Boss Helper] Message handler error:', error);
    sendResponse({ error: error.message });
  }
  
  return true; // Keep message channel open for async response
});

// Auto start if enabled in storage
chrome.storage.sync.get(['autoEnabled'], (result) => {
  if (result.autoEnabled) {
    console.log('[Boss Helper] Auto-starting monitor from storage');
    bossMonitor.start();
  }
});

// Notify background that content script is ready
chrome.runtime.sendMessage({
  type: 'CONTENT_SCRIPT_READY',
  url: window.location.href,
  mode: bossMonitor.isTestMode ? 'TEST' : 'PROD'
}).catch(err => {
  console.log('[Boss Helper] Failed to notify ready state:', err);
});

console.log('[Boss Helper] Content script loaded successfully');
