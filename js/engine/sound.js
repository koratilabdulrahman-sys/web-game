class SoundManager {
    constructor() {
        this.ctx = null;
        this.masterVolume = 0.3;
        this.enabled = false;
        this.bgmOsc = null;
    }

    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.enabled = true;
    }

    // Procedural SFX using Oscillators
    playTone(freq, type, duration, volume = 1, slide = 0) {
        if (!this.enabled || !this.ctx) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        if (slide !== 0) {
            osc.frequency.exponentialRampToValueAtTime(freq + slide, this.ctx.currentTime + duration);
        }
        
        gain.gain.setValueAtTime(volume * this.masterVolume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playNoise(duration, volume = 1) {
        if (!this.enabled || !this.ctx) return;
        
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(volume * this.masterVolume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        
        noise.connect(gain);
        gain.connect(this.ctx.destination);
        
        noise.start();
    }

    // Specific Game Sounds
    playJump() {
        this.playTone(150, 'square', 0.2, 0.5, 400); // Rising pitch
    }

    playShoot() {
        this.playTone(800, 'sawtooth', 0.1, 0.4, -400); // Sharp burst
        this.playNoise(0.05, 0.2); // Tiny snap
    }

    playHit() {
        this.playTone(100, 'triangle', 0.3, 0.8, -50); // Thud
    }

    playExplosion() {
        this.playTone(60, 'sawtooth', 0.5, 1, -40);
    }

    playCoin() {
        this.playTone(900, 'sine', 0.1, 0.6);
        setTimeout(() => this.playTone(1200, 'sine', 0.2, 0.6), 50);
    }

    playWin() {
        const notes = [523, 659, 783, 1046]; // C E G C
        notes.forEach((f, i) => {
            setTimeout(() => this.playTone(f, 'sine', 0.4, 0.6), i * 150);
        });
    }

    playLose() {
        this.playTone(200, 'sawtooth', 0.8, 0.6, -150);
    }

    startBGM() {
        if (!this.enabled || this.bgmOsc) return;
        // Simple 8-bit style pulsing bassline
        this.bgmOsc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        this.bgmOsc.type = 'triangle';
        this.bgmOsc.frequency.setValueAtTime(110, this.ctx.currentTime);
        gain.gain.value = 0.05 * this.masterVolume;
        this.bgmOsc.connect(gain);
        gain.connect(this.ctx.destination);
        this.bgmOsc.start();
    }
}

window.sounds = new SoundManager();
