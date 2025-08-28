// Content Script - Monitors game state and performs auto actions
class BossMonitor {
  constructor() {
    this.isEnabled = false;
    this.isTestMode = this.detectTestMode();
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
                   window.location.href.includes('mock-bicanh.html');
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
      const elements = this.detectGameElements();
      const oldState = { ...this.gameState };
      
      // Update boss name
      if (elements.bossName) {
        this.gameState.bossName = elements.bossName.textContent.trim();
      }

      // Monitor challenge button state
      if (elements.challengeBtn) {
        const btnText = elements.challengeBtn.textContent.trim();
        const isDisabled = elements.challengeBtn.disabled || 
                          elements.challengeBtn.classList.contains('disabled');
        
        if (btnText.includes('Còn') && isDisabled) {
          // Countdown state
          this.gameState.status = 'countdown';
          this.gameState.timeLeft = this.parseCountdown(btnText);
          this.gameState.canChallenge = false;
          
        } else if (btnText.includes('KHIÊU CHIẾN') && !isDisabled) {
          // Ready to challenge
          this.gameState.status = 'ready';
          this.gameState.timeLeft = 0;
          this.gameState.canChallenge = true;
          
        } else if (btnText.includes('Hết Lượt')) {
          // No attacks left
          this.gameState.status = 'depleted';
          this.gameState.timeLeft = 0;
          this.gameState.canChallenge = false;
          
        } else {
          // Unknown state
          this.gameState.status = 'unknown';
          this.gameState.canChallenge = false;
        }
      }

      // Update attacks left
      if (elements.attackCount) {
        const attackText = elements.attackCount.textContent.trim();
        const attackNum = parseInt(attackText);
        if (!isNaN(attackNum)) {
          this.gameState.attacksLeft = attackNum;
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
    if (!this.isEnabled || !this.gameState.canChallenge) return;

    try {
      const elements = this.detectGameElements();
      
      if (elements.challengeBtn && 
          !elements.challengeBtn.disabled && 
          !elements.challengeBtn.classList.contains('disabled')) {
        
        console.log('[Boss Helper] Auto challenging boss...');
        elements.challengeBtn.click();
        
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

  // Wait for popup to load and then attack
  waitForPopupAndAttack() {
    if (!this.isEnabled) return;

    console.log('[Boss Helper] Waiting for popup to load...');
    
    // Check every 500ms for popup to appear, max 10 seconds
    let attempts = 0;
    const maxAttempts = 20; // 10 seconds / 500ms
    
    const checkPopup = setInterval(() => {
      attempts++;
      
      const elements = this.detectGameElements();
      
      // Check if popup is loaded and visible
      if (elements.bossPopup && 
          (elements.bossPopup.classList.contains('show') || 
           elements.bossPopup.style.display === 'block' ||
           window.getComputedStyle(elements.bossPopup).display !== 'none')) {
        
        console.log('[Boss Helper] Popup detected, looking for attack button...');
        clearInterval(checkPopup);
        
        // Wait a bit more for popup content to be fully rendered
        setTimeout(() => {
          this.autoAttack();
        }, 1500); // Increased wait time for popup content
        
      } else if (attempts >= maxAttempts) {
        console.log('[Boss Helper] Popup load timeout after', attempts * 0.5, 'seconds');
        clearInterval(checkPopup);
      } else {
        console.log(`[Boss Helper] Waiting for popup... attempt ${attempts}/${maxAttempts}`);
      }
    }, 500);
  }

  // Auto attack in popup
  async autoAttack() {
    if (!this.isEnabled) return;

    try {
      const elements = this.detectGameElements();
      
      // Make sure popup is visible first
      if (!elements.bossPopup || 
          (!elements.bossPopup.classList.contains('show') && 
           elements.bossPopup.style.display !== 'block' &&
           window.getComputedStyle(elements.bossPopup).display === 'none')) {
        console.log('[Boss Helper] Popup not visible for attack');
        return;
      }

      console.log('[Boss Helper] Looking for attack button in popup...');
      
      // Primary: Try by ID first (most reliable)
      let attackBtn = elements.bossPopup.querySelector('#attack-boss-btn');
      
      if (attackBtn) {
        console.log('[Boss Helper] Found attack button by ID: #attack-boss-btn');
      } else {
        // Fallback: Try by class
        attackBtn = elements.bossPopup.querySelector('.attack-button');
        if (attackBtn) {
          console.log('[Boss Helper] Found attack button by class: .attack-button');
        } else {
          // Final fallback: Try text-based search
          const buttons = elements.bossPopup.querySelectorAll('button');
          for (let btn of buttons) {
            const text = btn.textContent.trim().toUpperCase();
            if (text.includes('TẤN CÔNG') || text.includes('TAN CONG') || text.includes('ATTACK')) {
              attackBtn = btn;
              console.log('[Boss Helper] Found attack button by text:', text);
              break;
            }
          }
        }
      }
      
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
        
      } else {
        console.log('[Boss Helper] Attack button not available:', {
          found: !!attackBtn,
          disabled: attackBtn?.disabled,
          hasDisabledClass: attackBtn?.classList.contains('disabled')
        });
        
        // Log all buttons in popup for debugging
        const allButtons = elements.bossPopup.querySelectorAll('button');
        console.log('[Boss Helper] All buttons in popup:', 
          Array.from(allButtons).map(btn => ({
            text: btn.textContent.trim(),
            className: btn.className,
            id: btn.id
          }))
        );
      }
    } catch (error) {
      console.error('[Boss Helper] Error in auto attack:', error);
    }
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
      
      if (this.isEnabled && this.gameState.canChallenge) {
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
