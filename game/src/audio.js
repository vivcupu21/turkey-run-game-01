// SPDX-License-Identifier: MIT
// Turkey Run: synthesized sound effects — WebAudio only, no audio files, so
// the game stays fully offline. Created lazily on the first player gesture.
'use strict';

const TurkeySound = (function () {
  let audioContext = null;
  let muted = false;

  function ensureContext() {
    if (audioContext) return audioContext;
    try {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return null;
      audioContext = new AudioCtor();
    } catch (err) {
      audioContext = null;
    }
    return audioContext;
  }

  function unlock() {
    const ctx = ensureContext();
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(function () {});
  }

  function tone(freqFrom, freqTo, seconds, type, volume, delay) {
    if (muted) return;
    const ctx = ensureContext();
    if (!ctx) return;
    try {
      const start = ctx.currentTime + (delay || 0);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freqFrom, start);
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqTo), start + seconds);
      gain.gain.setValueAtTime(volume || 0.12, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + seconds + 0.02);
    } catch (err) {
      /* sound is decoration; never break the game */
    }
  }

  return {
    unlock: unlock,
    setMuted: function (value) { muted = !!value; },
    isMuted: function () { return muted; },
    jump: function () { tone(280, 620, 0.16, 'sine', 0.10); },
    doubleJump: function () { tone(420, 880, 0.14, 'triangle', 0.09); },
    slide: function () { tone(300, 140, 0.12, 'sawtooth', 0.05); },
    corn: function () { tone(880, 1320, 0.10, 'sine', 0.10); tone(1320, 1760, 0.12, 'sine', 0.08, 0.07); },
    goldenCorn: function () { tone(660, 990, 0.10, 'triangle', 0.11); tone(990, 1320, 0.10, 'triangle', 0.10, 0.08); tone(1320, 1980, 0.16, 'triangle', 0.09, 0.16); },
    hit: function () { tone(180, 60, 0.28, 'sawtooth', 0.16); tone(90, 40, 0.30, 'square', 0.10, 0.02); },
    gobble: function () {
      tone(300, 180, 0.09, 'square', 0.07);
      tone(300, 180, 0.09, 'square', 0.07, 0.11);
      tone(340, 200, 0.12, 'square', 0.07, 0.22);
    },
    caught: function () {
      tone(392, 392, 0.22, 'triangle', 0.12);
      tone(370, 370, 0.22, 'triangle', 0.12, 0.22);
      tone(349, 330, 0.45, 'triangle', 0.12, 0.44);
    },
    escaped: function () {
      const notes = [523, 659, 784, 1047];
      notes.forEach(function (freq, i) { tone(freq, freq, 0.18, 'triangle', 0.11, i * 0.13); });
      tone(1319, 1319, 0.4, 'triangle', 0.10, 0.55);
    },
  };
})();
