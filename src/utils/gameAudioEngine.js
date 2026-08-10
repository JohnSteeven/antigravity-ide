/**
 * Web Audio Synthesizer Engine for MyJourney Games
 * Generates continuous background music loops & sound effects dynamically
 * using Web Audio API without external audio file dependencies.
 */

let audioCtx = null;
let masterGain = null;
let musicGain = null;
let sfxGain = null;
let currentMusicTheme = null;
let musicTimerId = null;
let isMuted = false;
let globalVolume = 0.7;

// Initialize or return AudioContext
export const getAudioContext = () => {
  if (typeof window === "undefined") return null;

  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioCtx = new AudioContextClass();

    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(isMuted ? 0 : globalVolume, audioCtx.currentTime);
    masterGain.connect(audioCtx.destination);

    musicGain = audioCtx.createGain();
    musicGain.gain.setValueAtTime(0.55, audioCtx.currentTime); // Background music volume
    musicGain.connect(masterGain);

    sfxGain = audioCtx.createGain();
    sfxGain.gain.setValueAtTime(0.85, audioCtx.currentTime); // SFX volume
    sfxGain.connect(masterGain);

    // Auto unlock on first user click or interaction anywhere on document
    const unlock = () => {
      if (audioCtx && audioCtx.state === "suspended") {
        audioCtx.resume().then(() => {
          if (currentMusicTheme && !musicTimerId && !isMuted) {
            startMusicLoop(currentMusicTheme);
          }
        }).catch(() => {});
      }
    };

    window.addEventListener("click", unlock, { capture: true, passive: true });
    window.addEventListener("keydown", unlock, { capture: true, passive: true });
    window.addEventListener("pointerdown", unlock, { capture: true, passive: true });
    window.addEventListener("touchstart", unlock, { capture: true, passive: true });
  }

  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }

  return audioCtx;
};

// Play synthesized sound effects
export const playSfx = (type = "click") => {
  const ctx = getAudioContext();
  if (!ctx || isMuted || !sfxGain) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(sfxGain);

  switch (type) {
    case "click":
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.linearRampToValueAtTime(200, now + 0.05);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
      break;

    case "select":
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.06); // E5
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.16);
      osc.start(now);
      osc.stop(now + 0.16);
      break;

    case "bid": {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(sfxGain);

      osc.type = "sine";
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.linearRampToValueAtTime(1318.51, now + 0.08); // E6
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.15);

      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(329.63, now); // E4
      gain2.gain.setValueAtTime(0.3, now);
      gain2.gain.linearRampToValueAtTime(0.01, now + 0.15);

      osc.start(now);
      osc2.start(now);
      osc.stop(now + 0.15);
      osc2.stop(now + 0.15);
      break;
    }

    case "timer":
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
      break;

    case "win": {
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const noteOsc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        noteOsc.connect(noteGain);
        noteGain.connect(sfxGain);
        noteOsc.type = "triangle";
        noteOsc.frequency.setValueAtTime(freq, now + idx * 0.07);
        noteGain.gain.setValueAtTime(0.35, now + idx * 0.07);
        noteGain.gain.linearRampToValueAtTime(0.01, now + idx * 0.07 + 0.25);
        noteOsc.start(now + idx * 0.07);
        noteOsc.stop(now + idx * 0.07 + 0.25);
      });
      break;
    }

    case "outbid":
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(160, now + 0.2);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
      break;

    default:
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
      break;
  }
};

// Play synthesized music notes for a theme step
const playThemeNote = (ctx, theme, step) => {
  if (!ctx || isMuted || !musicGain) return;
  const now = ctx.currentTime;

  let chord = [];
  let bass = 110;

  if (theme === "play-life") {
    // Ambient relaxing chords
    const scales = [
      [261.63, 329.63, 392.00], // C major
      [220.00, 261.63, 329.63], // A minor
      [174.61, 220.00, 261.63], // F major
      [196.00, 246.94, 293.66], // G major
    ];
    chord = scales[step % scales.length];
    bass = chord[0] / 2;
  } else if (theme === "who-knows-me-better") {
    // Upbeat game-show synth progression
    const scales = [
      [293.66, 369.99, 440.00], // D major
      [246.94, 293.66, 369.99], // B minor
      [196.00, 246.94, 293.66], // G major
      [220.00, 277.18, 329.63], // A major
    ];
    chord = scales[step % scales.length];
    bass = chord[0] / 2;
  } else if (theme === "life-auction") {
    // Dramatic auction lounge bass & shimmering progression
    const scales = [
      [220.00, 261.63, 329.63], // A minor
      [174.61, 220.00, 261.63], // F major
      [207.65, 261.63, 311.13], // Ab major
      [164.81, 196.00, 246.94], // E minor
    ];
    chord = scales[step % scales.length];
    bass = chord[0] / 2;
  }

  // Play bass note
  try {
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bassOsc.type = theme === "life-auction" ? "sawtooth" : "triangle";
    bassOsc.frequency.setValueAtTime(bass, now);
    bassGain.gain.setValueAtTime(0.12, now);
    bassGain.gain.linearRampToValueAtTime(0.001, now + 1.8);
    bassOsc.connect(bassGain);
    bassGain.connect(musicGain);
    bassOsc.start(now);
    bassOsc.stop(now + 1.8);

    // Play chord notes
    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.06, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.001, now + idx * 0.08 + 1.6);
      osc.connect(gain);
      gain.connect(musicGain);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 1.6);
    });
  } catch (error) {
    // Ignore transient Web Audio scheduling errors
  }
};

// Start or update background music loop
export const startMusicLoop = (theme = "play-life") => {
  currentMusicTheme = theme;
  const ctx = getAudioContext();
  if (!ctx) return;

  if (musicTimerId) {
    clearInterval(musicTimerId);
    musicTimerId = null;
  }

  let step = 0;
  if (ctx.state === "running" && !isMuted) {
    playThemeNote(ctx, theme, step);
    step += 1;
  }

  const intervalMs = theme === "who-knows-me-better" ? 2200 : (theme === "life-auction" ? 2000 : 2500);
  musicTimerId = setInterval(() => {
    const currentCtx = getAudioContext();
    if (currentCtx && currentCtx.state === "running" && !isMuted && currentMusicTheme) {
      playThemeNote(currentCtx, theme, step);
      step += 1;
    }
  }, intervalMs);
};

// Stop background music loop
export const stopMusicLoop = () => {
  if (musicTimerId) {
    clearInterval(musicTimerId);
    musicTimerId = null;
  }
  currentMusicTheme = null;
};

// Set Volume & Mute control
export const setGameVolume = (volume) => {
  globalVolume = Math.max(0, Math.min(1, volume));
  if (masterGain && !isMuted && audioCtx) {
    masterGain.gain.setValueAtTime(globalVolume, audioCtx.currentTime);
  }
};

export const toggleGameMute = () => {
  isMuted = !isMuted;
  if (masterGain && audioCtx) {
    masterGain.gain.setValueAtTime(isMuted ? 0 : globalVolume, audioCtx.currentTime);
  }
  if (isMuted) {
    stopMusicLoop();
  } else if (currentMusicTheme) {
    startMusicLoop(currentMusicTheme);
  }
  return isMuted;
};

export const getIsMuted = () => isMuted;
