// Retro Web Audio API Synthesizer for MUSTACHE PROTOCOL
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.sfxEnabled = true;
    this.bgmEnabled = true;
    this.bgmAudio = null;
    this._isBuff = false;
    this._isBoss = false;
  }

  get isBuff() {
    return this._isBuff;
  }

  _syncBgmDynamics() {
    if (!this.bgmAudio) return;
    this.bgmAudio.volume = this._isBuff ? 0.56 : this._isBoss ? 0.50 : 0.42;
    this.bgmAudio.playbackRate = this._isBuff ? 1.08 : this._isBoss ? 1.06 : 1.0;
  }

  set isBuff(val) {
    this._isBuff = !!val;
    this._syncBgmDynamics();
  }

  setBossTension(active) {
    this._isBoss = !!active;
    this._syncBgmDynamics();
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  toggleSfx() {
    this.sfxEnabled = !this.sfxEnabled;
    return this.sfxEnabled;
  }

  toggleBgm() {
    this.bgmEnabled = !this.bgmEnabled;
    if (this.bgmEnabled) {
      this.startBgm();
    } else {
      this.stopBgm();
    }
    return this.bgmEnabled;
  }

  playTone(freq, duration, type = "square", volume = 0.12, slideTo = null, delay = 0) {
    if (!this.sfxEnabled) return;
    this.init();
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + duration);
    }
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.01);
  }

  playNoise(duration, volume = 0.14, filterFreq = 1200, delay = 0) {
    if (!this.sfxEnabled) return;
    this.init();
    const t0 = this.ctx.currentTime + delay;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(filterFreq, t0);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(t0);
    noise.stop(t0 + duration + 0.01);
  }

  punchSwing() {
    this.playNoise(0.07, 0.08, 1800);
    this.playTone(220, 0.06, "triangle", 0.06, 90);
  }

  punchHit(superStrong = false) {
    if (superStrong) {
      this.playNoise(0.16, 0.25, 650);
      this.playTone(160, 0.18, "sawtooth", 0.2, 35);
      this.playTone(90, 0.22, "square", 0.18, 28, 0.02);
    } else {
      this.playNoise(0.09, 0.16, 950);
      this.playTone(150, 0.09, "square", 0.14, 48);
    }
  }

  jump() {
    this.playTone(180, 0.12, "square", 0.08, 420);
  }

  hurt() {
    this.playNoise(0.12, 0.18, 500);
    this.playTone(190, 0.16, "sawtooth", 0.14, 65);
  }

  // Iconic Henry Cavill Arm Reload: CHK-CHK + Electric Power-Up Surge!
  armReload() {
    // First metallic cock (CHK)
    this.playNoise(0.06, 0.24, 2400, 0.0);
    this.playTone(520, 0.05, "square", 0.15, 220, 0.0);
    // Second metallic cock (CHK!)
    this.playNoise(0.08, 0.28, 3000, 0.13);
    this.playTone(680, 0.07, "square", 0.18, 280, 0.13);
    // Lightning crackle & rising power chord
    this.playNoise(0.32, 0.22, 4200, 0.26);
    this.playTone(110, 0.42, "sawtooth", 0.18, 440, 0.26);
    this.playTone(165, 0.42, "square", 0.14, 660, 0.30);
    // Pocket ding!
    this.playTone(1046, 0.12, "triangle", 0.14, 1568, 0.72);
  }

  // Samurai Katana Horizontal Slash
  katanaSlash(heavy = false) {
    this.playNoise(heavy ? 0.12 : 0.08, heavy ? 0.16 : 0.11, heavy ? 3600 : 4400);
    this.playTone(heavy ? 920 : 1200, heavy ? 0.13 : 0.09, "sawtooth", heavy ? 0.09 : 0.06, 260);
    if (heavy) {
      this.playTone(1760, 0.11, "triangle", 0.07, 620, 0.02);
    }
  }

  katanaHit(superStrong = false) {
    this.playNoise(superStrong ? 0.14 : 0.09, superStrong ? 0.22 : 0.15, 2800);
    this.playTone(superStrong ? 1320 : 980, 0.09, "triangle", 0.12, 340);
    this.playTone(superStrong ? 140 : 180, 0.12, "sawtooth", 0.15, 45);
  }

  // Street Samurai Dual-Katana X-Cross Dash ("雙刀模式・交叉突進")
  dualCrossDash() {
    // High-speed dash whoosh
    this.playNoise(0.14, 0.18, 2200, 0);
    this.playTone(620, 0.12, "sawtooth", 0.1, 1480, 0);
    // Twin intersecting katana X-slash ring!
    this.playNoise(0.14, 0.22, 4600, 0.11);
    this.playTone(1320, 0.16, "triangle", 0.15, 440, 0.11);
    this.playTone(1760, 0.18, "sawtooth", 0.11, 587, 0.14);
  }

  // Samurai Ultimate: Katana Flurry + Sword Aura Activation!
  bladeStormActivate() {
    // Crisp unsheathe SCHWING!
    this.playNoise(0.16, 0.22, 5200, 0.0);
    this.playTone(1480, 0.28, "triangle", 0.16, 2960, 0.0);
    this.playTone(2217, 0.32, "sine", 0.12, 1760, 0.04);
    // Rapid flurry slashes during activation
    for (let i = 0; i < 4; i++) {
      this.playNoise(0.07, 0.16, 3800 + i * 350, 0.22 + i * 0.09);
      this.playTone(880 + i * 160, 0.08, "sawtooth", 0.09, 280, 0.22 + i * 0.09);
    }
    // Deep sword-qi resonance
    this.playTone(146.8, 0.45, "sawtooth", 0.14, 293.6, 0.32);
  }

  brisketPop() {
    this.playTone(330, 0.08, "triangle", 0.12, 660, 0);
    this.playTone(523, 0.12, "triangle", 0.12, 880, 0.07);
  }

  brisketEat() {
    // Chomps
    this.playNoise(0.05, 0.14, 900, 0.0);
    this.playNoise(0.05, 0.14, 1100, 0.09);
    // Retro heal arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, i) => {
      this.playTone(n, 0.11, "square", 0.1, null, 0.16 + i * 0.065);
    });
  }

  enemyKo() {
    this.playTone(260, 0.18, "sawtooth", 0.12, 55);
    this.playNoise(0.14, 0.14, 700, 0.04);
  }

  stageClear() {
    const melody = [523, 659, 784, 1046, 784, 1046];
    const times = [0, 0.1, 0.2, 0.32, 0.48, 0.6];
    melody.forEach((freq, i) => {
      this.playTone(freq, 0.18, "square", 0.12, null, times[i]);
    });
  }

  skillUnlock() {
    const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.5];
    notes.forEach((freq, i) => {
      this.playTone(freq, 0.16, "triangle", 0.14, null, i * 0.075);
      this.playTone(freq * 0.5, 0.16, "square", 0.07, null, i * 0.075);
    });
  }

  toxicTick() {
    this.playNoise(0.11, 0.07, 720);
    this.playTone(190, 0.1, "sine", 0.05, 110);
  }

  bossMutate() {
    this.playNoise(0.55, 0.25, 420);
    this.playTone(130, 0.65, "sawtooth", 0.2, 42);
    this.playTone(95, 0.65, "square", 0.16, 32, 0.06);
    this.playTone(260, 0.4, "sawtooth", 0.12, 520, 0.28);
  }

  bossKickWave() {
    this.playNoise(0.14, 0.18, 2600);
    this.playTone(620, 0.18, "sawtooth", 0.14, 160);
  }

  bossDiveSwoop() {
    this.playNoise(0.24, 0.22, 1900);
    this.playTone(760, 0.28, "sawtooth", 0.16, 85);
  }

  bossDiveImpact() {
    this.playNoise(0.28, 0.28, 380);
    this.playTone(110, 0.3, "square", 0.22, 28);
  }

  // Momo: Pepper Spray hiss!
  pepperSpray() {
    this.playNoise(0.22, 0.16, 4800);
    this.playTone(1400, 0.14, "sine", 0.04, 2400);
  }

  // Momo: Vampire Awakening transformation!
  vampireTransform() {
    this.playTone(185, 0.55, "sawtooth", 0.16, 554.37);
    this.playTone(220, 0.55, "triangle", 0.14, 659.25, 0.08);
    this.playNoise(0.32, 0.16, 2600, 0.12);
    this.playTone(880, 0.22, "sine", 0.12, 1318.5, 0.42);
  }

  // Momo: Vampire Long-Claw Slash + Lifesteal chime!
  vampireClaw() {
    this.playNoise(0.11, 0.17, 3600);
    this.playTone(1120, 0.11, "sawtooth", 0.1, 320);
  }

  lifestealChime() {
    this.playTone(659.25, 0.08, "triangle", 0.09, 987.77);
  }

  // Stage 3 《末班機》 Cinematic & Dual Boss Audio Cues!
  heliRotorPulse() {
    this.playNoise(0.08, 0.12, 240);
    this.playTone(68, 0.09, "triangle", 0.1, 42);
  }

  doorSlamClick() {
    // Crisp metallic "喀!" cabin door kick-shut signal!
    this.playNoise(0.08, 0.28, 1600, 0);
    this.playTone(420, 0.07, "square", 0.2, 110, 0);
    this.playTone(1280, 0.09, "triangle", 0.18, 620, 0.03);
  }

  heelTap() {
    // Sharp leather dress-shoe heel click on wet tarmac ("叩!")
    this.playNoise(0.04, 0.24, 3400, 0);
    this.playTone(1180, 0.055, "triangle", 0.22, 460, 0);
  }

  heelDoubleTap() {
    // "叩！叩！" Telegraph for 合體技「末班起飛」!
    this.heelTap();
    this.playNoise(0.04, 0.26, 3600, 0.15);
    this.playTone(1320, 0.06, "triangle", 0.24, 520, 0.15);
  }

  waterSweep() {
    this.playNoise(0.22, 0.2, 2400);
    this.playTone(340, 0.18, "sine", 0.12, 120);
  }

  comboBreak() {
    this.playTone(880, 0.14, "square", 0.18, 1760, 0);
    this.playTone(1318, 0.18, "triangle", 0.16, 2093, 0.06);
    this.playNoise(0.12, 0.2, 3200, 0);
  }

  // Mustache Hero Small Skill: 《重裝震地槌》(Ground Slam)
  groundSlam() {
    this.playNoise(0.28, 0.28, 420, 0);
    this.playTone(135, 0.3, "sawtooth", 0.22, 32, 0);
    this.playTone(88, 0.34, "square", 0.2, 26, 0.02);
    this.playTone(320, 0.12, "triangle", 0.12, 90, 0.04);
  }

  // Street Samurai Small Skill: 《殘影瞬步・居合》(Shadow Dash Slash)
  shadowDash() {
    this.playNoise(0.14, 0.18, 3800, 0);
    this.playTone(740, 0.12, "sine", 0.12, 1880, 0);
    this.playTone(1320, 0.1, "triangle", 0.1, 480, 0.06);
  }

  // Momo Small Skill: 《血蝠瞬閃》(Bat Blink)
  batBlink() {
    this.playNoise(0.16, 0.15, 2900, 0);
    this.playTone(540, 0.09, "triangle", 0.11, 980, 0);
    this.playTone(880, 0.11, "sine", 0.09, 440, 0.06);
    this.playNoise(0.14, 0.12, 4200, 0.08);
  }

  // Raven (暗影會・暗殺者) SFX: Dagger, Throwing Knives, Smoke & Grapple, Dual Pistols & Eclipse Mode!
  daggerSlash() {
    this.playNoise(0.06, 0.13, 5200, 0);
    this.playTone(1580, 0.07, "triangle", 0.09, 420, 0);
  }

  throwingKnife() {
    this.playNoise(0.08, 0.12, 6200, 0);
    this.playTone(2100, 0.09, "sine", 0.08, 920, 0);
    this.playTone(1800, 0.08, "triangle", 0.07, 740, 0.04);
  }

  grappleSmoke() {
    // Smoke bomb pop + steel grappling hook zip!
    this.playNoise(0.18, 0.2, 1400, 0);
    this.playTone(420, 0.12, "sawtooth", 0.12, 1380, 0.03);
    this.playTone(1640, 0.08, "triangle", 0.11, 920, 0.11);
  }

  dualPistolShot() {
    // Crisp suppressed tactical twin-pistol snap!
    this.playNoise(0.07, 0.22, 2200, 0);
    this.playTone(340, 0.06, "square", 0.15, 85, 0);
    this.playNoise(0.06, 0.18, 2800, 0.05);
    this.playTone(390, 0.05, "square", 0.13, 95, 0.05);
  }

  eclipseActivate() {
    // Twin pistol slide rack + dark golden Eclipse resonance!
    this.playNoise(0.06, 0.2, 3400, 0);
    this.playTone(620, 0.06, "square", 0.13, 280, 0);
    this.playNoise(0.06, 0.22, 3800, 0.11);
    this.playTone(760, 0.07, "square", 0.14, 320, 0.11);
    this.playTone(164.8, 0.5, "sawtooth", 0.16, 493.88, 0.22);
    this.playTone(246.9, 0.45, "triangle", 0.14, 740, 0.28);
  }

  // Shaka (釋迦) Divine Spectral Arm SFX: Palm, Clap, Restrain Bind, Thousand-Hand Ult & Heaven Drop!
  shakaPalm() {
    this.playNoise(0.11, 0.14, 1600, 0);
    this.playTone(392, 0.12, "sine", 0.12, 196, 0);
    this.playTone(784, 0.08, "triangle", 0.07, 523, 0.02);
  }

  shakaClap() {
    // Resonant golden temple gong + palm shockwave!
    this.playNoise(0.18, 0.22, 900, 0);
    this.playTone(261.6, 0.32, "triangle", 0.18, 130.8, 0);
    this.playTone(523.25, 0.28, "sine", 0.12, 392, 0.02);
  }

  shakaBind() {
    // Crystalline golden chain lock chime!
    this.playTone(587.33, 0.14, "triangle", 0.13, 880, 0);
    this.playTone(880, 0.18, "sine", 0.11, 1174.66, 0.06);
    this.playNoise(0.12, 0.12, 2400, 0);
  }

  shakaUltActivate() {
    // Deep temple bell resonance + ascending golden halo chord!
    this.playTone(130.8, 0.75, "sine", 0.2, 130.8, 0);
    this.playTone(261.6, 0.65, "triangle", 0.14, 392, 0.05);
    this.playTone(523.25, 0.55, "sine", 0.12, 783.99, 0.16);
    this.playTone(1046.5, 0.4, "triangle", 0.1, 1318.5, 0.3);
  }

  shakaHeavenDrop() {
    // Massive seismic palm drop + divine gong!
    this.playNoise(0.32, 0.28, 360, 0);
    this.playTone(110, 0.45, "sawtooth", 0.22, 38, 0);
    this.playTone(220, 0.5, "triangle", 0.16, 110, 0.04);
    this.playTone(659.25, 0.35, "sine", 0.12, 329.6, 0.08);
  }

  // Alice (愛麗絲 / The Broker) Brass Knuckles & Linguistic Control SFX!
  alicePunch(heavy = false) {
    // Crisp metallic brass-knuckle crack!
    this.playNoise(heavy ? 0.12 : 0.07, heavy ? 0.22 : 0.14, heavy ? 2200 : 3200, 0);
    this.playTone(heavy ? 240 : 310, heavy ? 0.14 : 0.08, "sawtooth", heavy ? 0.16 : 0.1, 68, 0);
    if (heavy) {
      this.playTone(1046, 0.09, "triangle", 0.11, 523, 0.02);
    }
  }

  aliceVoiceCommand() {
    // Resonant crimson-gold linguistic soundwave pulse + armor-shatter chime!
    this.playTone(523.25, 0.22, "sine", 0.15, 261.6, 0);
    this.playTone(783.99, 0.26, "triangle", 0.12, 392, 0.03);
    this.playNoise(0.14, 0.16, 3600, 0.04);
  }

  aliceUltDomain() {
    // Deep hypnotic bass resonance + ascending crimson soundwave chord!
    this.playTone(146.8, 0.65, "sawtooth", 0.16, 293.6, 0);
    this.playTone(440, 0.5, "sine", 0.13, 880, 0.08);
    this.playNoise(0.24, 0.14, 2800, 0.12);
  }

  aliceFingerSnap() {
    // Sharp cold finger snap + shattering linguistic shockwave!
    this.playNoise(0.05, 0.28, 4800, 0);
    this.playTone(1960, 0.06, "triangle", 0.18, 880, 0);
    this.playNoise(0.28, 0.24, 1200, 0.07);
    this.playTone(130.8, 0.42, "sawtooth", 0.2, 42, 0.07);
  }

  // Arcade Boss Warning Siren
  bossWarning() {
    this.playTone(580, 0.22, "sawtooth", 0.16, 420, 0);
    this.playTone(580, 0.22, "sawtooth", 0.16, 420, 0.28);
    this.playTone(720, 0.28, "square", 0.14, 340, 0.56);
    this.playNoise(0.18, 0.12, 620, 0.05);
  }

  // Perfect Just-Dodge Time-Flash Chime
  justDodge() {
    this.playTone(880, 0.09, "sine", 0.16, 1760, 0);
    this.playTone(1318.5, 0.14, "triangle", 0.14, 2093, 0.04);
    this.playNoise(0.08, 0.12, 4600, 0);
  }

  // Dramatic Stage-End K.O. Slow-Motion Bass Drop!
  koFinish() {
    this.playNoise(0.38, 0.30, 520, 0);
    this.playTone(165, 0.55, "sawtooth", 0.22, 36, 0);
    this.playTone(330, 0.35, "triangle", 0.16, 82, 0.04);
    this.playTone(880, 0.22, "sine", 0.12, 440, 0.08);
  }

  // Stage Clear Rank Fanfare
  stageRankFanfare(isS = false) {
    const notes = isS ? [523.25, 659.25, 783.99, 1046.5, 1318.5] : [440, 554.37, 659.25, 880];
    notes.forEach((f, i) => {
      this.playTone(f, i === notes.length - 1 ? 0.36 : 0.14, "triangle", 0.14, null, i * 0.08);
    });
  }

  startBgm() {
    if (!this.bgmEnabled) return;
    if (!this.bgmAudio) {
      this.bgmAudio = new Audio("assets/bgm.m4a");
      this.bgmAudio.loop = true;
      this.bgmAudio.volume = this._isBuff ? 0.56 : 0.42;
      this.bgmAudio.playbackRate = this._isBuff ? 1.05 : 1.0;
    }
    const playPromise = this.bgmAudio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  }

  stopBgm() {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
    }
  }
}

window.sound = new SoundEngine();
