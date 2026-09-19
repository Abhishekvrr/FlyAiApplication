// Web Audio API Procedural Sound Effects for Vault Operations
// Zero external assets required — 100% reliable, zero latency.

class SoundFX {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Realistic mechanical vault unlocking sound: metallic click + spring release + sub-bass bolt clunk
  playLockOpen() {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // 1. Initial metallic latch click (high-frequency ping)
      const clickOsc = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      clickOsc.type = 'triangle';
      clickOsc.frequency.setValueAtTime(1400, now);
      clickOsc.frequency.exponentialRampToValueAtTime(320, now + 0.08);

      clickGain.gain.setValueAtTime(0.35, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      clickOsc.connect(clickGain);
      clickGain.connect(this.ctx.destination);
      clickOsc.start(now);
      clickOsc.stop(now + 0.1);

      // 2. Heavy mechanical vault bolt release (low thud / clunk)
      const boltOsc = this.ctx.createOscillator();
      const boltGain = this.ctx.createGain();
      boltOsc.type = 'sine';
      boltOsc.frequency.setValueAtTime(160, now + 0.05);
      boltOsc.frequency.exponentialRampToValueAtTime(45, now + 0.28);

      boltGain.gain.setValueAtTime(0.001, now);
      boltGain.gain.setValueAtTime(0.45, now + 0.05);
      boltGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      boltOsc.connect(boltGain);
      boltGain.connect(this.ctx.destination);
      boltOsc.start(now + 0.05);
      boltOsc.stop(now + 0.36);

      // 3. Shackle spring release rattle (frequency noise burst)
      const springOsc = this.ctx.createOscillator();
      const springGain = this.ctx.createGain();
      springOsc.type = 'sawtooth';
      springOsc.frequency.setValueAtTime(880, now + 0.12);
      springOsc.frequency.exponentialRampToValueAtTime(540, now + 0.24);

      springGain.gain.setValueAtTime(0.001, now);
      springGain.gain.setValueAtTime(0.2, now + 0.12);
      springGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      springOsc.connect(springGain);
      springGain.connect(this.ctx.destination);
      springOsc.start(now + 0.12);
      springOsc.stop(now + 0.26);

      // 4. Harmonic affirmative authorization chime (high-tech affirmation)
      const chimeOsc = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();
      chimeOsc.type = 'sine';
      chimeOsc.frequency.setValueAtTime(587.33, now + 0.22); // D5
      chimeOsc.frequency.setValueAtTime(880.00, now + 0.32); // A5

      chimeGain.gain.setValueAtTime(0.001, now);
      chimeGain.gain.setValueAtTime(0.25, now + 0.22);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      chimeOsc.connect(chimeGain);
      chimeGain.connect(this.ctx.destination);
      chimeOsc.start(now + 0.22);
      chimeOsc.stop(now + 0.66);
    } catch (e) {
      console.warn('Audio playback not permitted or unavailable', e);
    }
  }

  // Soft futuristic UI click
  playClick() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.05);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {}
  }

  // Futuristic telemetry radar ping for scans
  playScanPing() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1050, now);
      osc.frequency.exponentialRampToValueAtTime(1600, now + 0.12);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.setValueAtTime(0.15, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.23);
    } catch (e) {}
  }

  // Melodic confirmation chime
  playSuccessChime() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.07);
        gain.gain.setValueAtTime(0.001, now + i * 0.07);
        gain.gain.setValueAtTime(0.12, now + i * 0.07 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.26);
      });
    } catch (e) {}
  }
}

export const soundFX = new SoundFX();

