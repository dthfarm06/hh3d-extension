// Sound Manager for HH3D Khoáng Mạch Extension

class SoundManager {
  constructor() {
    this.sounds = {};
    this.isEnabled = true;
    this.volume = 0.7;
    this.loadSounds();
  }

  // Load all sound effects
  loadSounds() {
    // Success sound - Simple beep
    this.sounds.success = this.createBeepSound(800, 0.2); // High pitch, 200ms
    
    // Error sound - Lower beep
    this.sounds.error = this.createBeepSound(300, 0.3); // Low pitch, 300ms
    
    // Notification sound - Double beep
    this.sounds.notification = this.createDoubleBeep();
    
    // Reward sound - Pleasant chime
    this.sounds.reward = this.createChimeSound();
    
    console.log('🔊 Sound manager initialized with', Object.keys(this.sounds).length, 'sounds');
  }

  // Create a simple beep sound using Web Audio API
  createBeepSound(frequency = 800, duration = 0.2) {
    return () => {
      if (!this.isEnabled) return;
      
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
        
        // Clean up
        setTimeout(() => {
          try {
            audioContext.close();
          } catch (e) {
            console.log('Audio context cleanup warning:', e.message);
          }
        }, duration * 1000 + 100);
        
      } catch (error) {
        console.error('Error playing beep sound:', error);
      }
    };
  }

  // Create double beep notification sound
  createDoubleBeep() {
    return () => {
      if (!this.isEnabled) return;
      
      const beep1 = this.createBeepSound(600, 0.15);
      const beep2 = this.createBeepSound(800, 0.15);
      
      beep1();
      setTimeout(beep2, 200);
    };
  }

  // Create chime sound for rewards
  createChimeSound() {
    return () => {
      if (!this.isEnabled) return;
      
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator1 = audioContext.createOscillator();
        const oscillator2 = audioContext.createOscillator();
        const oscillator3 = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        oscillator3.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Major chord (C-E-G)
        oscillator1.frequency.value = 523.25; // C5
        oscillator2.frequency.value = 659.25; // E5
        oscillator3.frequency.value = 783.99; // G5
        
        oscillator1.type = 'sine';
        oscillator2.type = 'sine';
        oscillator3.type = 'sine';
        
        const duration = 0.8;
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.2, audioContext.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator1.start(audioContext.currentTime);
        oscillator2.start(audioContext.currentTime + 0.1);
        oscillator3.start(audioContext.currentTime + 0.2);
        
        oscillator1.stop(audioContext.currentTime + duration);
        oscillator2.stop(audioContext.currentTime + duration);
        oscillator3.stop(audioContext.currentTime + duration);
        
        // Clean up
        setTimeout(() => {
          try {
            audioContext.close();
          } catch (e) {
            console.log('Audio context cleanup warning:', e.message);
          }
        }, duration * 1000 + 100);
        
      } catch (error) {
        console.error('Error playing chime sound:', error);
      }
    };
  }

  // Play specific sound
  play(soundName) {
    if (!this.isEnabled) {
      console.log(`🔇 Sound disabled: ${soundName}`);
      return;
    }

    if (this.sounds[soundName]) {
      console.log(`🔊 Playing sound: ${soundName}`);
      this.sounds[soundName]();
    } else {
      console.warn(`🔊 Sound not found: ${soundName}`);
    }
  }

  // Enable/disable sounds
  setEnabled(enabled) {
    this.isEnabled = enabled;
    console.log(`🔊 Sounds ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Set volume (0.0 to 1.0)
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    console.log(`🔊 Volume set to: ${Math.round(this.volume * 100)}%`);
  }

  // Test all sounds
  testAllSounds() {
    console.log('🔊 Testing all sounds...');
    const soundNames = Object.keys(this.sounds);
    
    soundNames.forEach((soundName, index) => {
      setTimeout(() => {
        console.log(`🔊 Testing: ${soundName}`);
        this.play(soundName);
      }, index * 1000);
    });
  }
}

// Create global sound manager instance
window.soundManager = new SoundManager();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SoundManager;
}
