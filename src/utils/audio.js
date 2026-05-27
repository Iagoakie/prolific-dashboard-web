// Utility class for simple UI sound effects using Web Audio API

class AudioManager {
  constructor() {
    this.audioCtx = null;
  }

  init() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  playTone(frequency, type, duration, vol = 0.1) {
    if (!this.audioCtx) this.init();
    
    const oscillator = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);

    gainNode.gain.setValueAtTime(vol, this.audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);

    oscillator.start();
    oscillator.stop(this.audioCtx.currentTime + duration);
  }

  playSuccess() {
    this.playTone(523.25, 'sine', 0.1); // C5
    setTimeout(() => this.playTone(659.25, 'sine', 0.2), 100); // E5
  }

  playCoin() {
    this.playTone(987.77, 'sine', 0.1, 0.1); // B5
    setTimeout(() => this.playTone(1318.51, 'sine', 0.3, 0.1), 100); // E6
  }

  playLevelUp() {
    this.playTone(440, 'triangle', 0.1);
    setTimeout(() => this.playTone(554.37, 'triangle', 0.1), 100);
    setTimeout(() => this.playTone(659.25, 'triangle', 0.1), 200);
    setTimeout(() => this.playTone(880, 'triangle', 0.4), 300);
  }

  playToggle() {
    this.playTone(300, 'sine', 0.1, 0.05);
  }
}

export const audioManager = new AudioManager();
