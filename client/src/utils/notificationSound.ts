// Enhanced notification sound utility with better error handling
export class NotificationSound {
  private audioContext: AudioContext | null = null;
  private isInitialized: boolean = false;
  private soundEnabled: boolean = true;

  constructor() {
    // Initialize AudioContext if available
    if (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      } catch (error) {
        console.warn('Failed to initialize AudioContext:', error);
        this.audioContext = null;
      }
    }
  }

  // Play a simple notification beep
  playNotificationSound(type: string = 'default') {
    if (!this.audioContext) {
      console.log('AudioContext not available');
      return;
    }

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Different sounds for different notification types
      switch (type) {
        case 'bid_approved':
        case 'auction_won':
          // Success sound - higher frequency, pleasant tone
          oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
          oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime + 0.1);
          break;
        
        case 'bid_rejected':
          // Error sound - lower frequency
          oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
          break;
        
        case 'outbid':
          // Warning sound - two-tone beep
          oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
          oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime + 0.15);
          break;
        
        case 'auction_live':
          // Info sound - medium frequency
          oscillator.frequency.setValueAtTime(700, this.audioContext.currentTime);
          break;
        
        default:
          // Default notification sound
          oscillator.frequency.setValueAtTime(650, this.audioContext.currentTime);
          break;
      }

      oscillator.type = 'sine';
      
      // Envelope to prevent clicking sounds
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Failed to play notification sound:', error);
    }
  }

  // Check if user has given permission for audio
  async requestAudioPermission() {
    if (!this.audioContext) {
      return false;
    }

    try {
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.log('Audio permission denied:', error);
      return false;
    }
  }

  // Enable/disable sound
  setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  // Get sound enabled status
  isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  // Test sound playback
  async testSound() {
    if (!this.soundEnabled) {
      console.log('Sound is disabled');
      return;
    }

    // Request permission first if needed
    await this.requestAudioPermission();
    
    // Play a test sound
    this.playNotificationSound('default');
  }
}

// Global instance
export const notificationSound = new NotificationSound();

// Type declaration for webkit AudioContext
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}
