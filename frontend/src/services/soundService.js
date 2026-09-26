/**
 * Web Audio API Notification & Audio Playback Engine
 * Produces crisp, loud, synthesized chimes, sirens, and alerts directly through laptop speakers
 * without relying on external mp3 files or network assets.
 */

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play a synthesized sound tone through the laptop speakers
 * @param {'critical_alert' | 'incident_report' | 'success' | 'dispatch' | 'ping' | 'click'} type
 */
export function playNotificationSound(type = 'incident_report') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);

    if (type === 'critical_alert') {
      // High-priority 2-tone emergency siren
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(880, now); // A5
      osc1.frequency.exponentialRampToValueAtTime(440, now + 0.3); // A4
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.6);

      osc2.frequency.setValueAtTime(440, now);
      osc2.frequency.exponentialRampToValueAtTime(880, now + 0.3);
      osc2.frequency.exponentialRampToValueAtTime(440, now + 0.6);

      gainNode.gain.setValueAtTime(0.35, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

      osc1.connect(gainNode);
      osc2.connect(gainNode);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.7);
      osc2.stop(now + 0.7);
    } else if (type === 'incident_report') {
      // 3-note ascending tactical chime (C5 -> E5 -> G5)
      const freqs = [523.25, 659.25, 783.99];
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.12);

        noteGain.gain.setValueAtTime(0, now + idx * 0.12);
        noteGain.gain.linearRampToValueAtTime(0.3, now + idx * 0.12 + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.35);

        osc.connect(noteGain);
        noteGain.connect(ctx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.35);
      });
    } else if (type === 'dispatch') {
      // 2-tone dispatch radar pulse
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

      gainNode.gain.setValueAtTime(0.25, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gainNode);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'success') {
      // Smooth positive major chord
      [523.25, 659.25, 1046.5].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now);

        noteGain.gain.setValueAtTime(0.2, now);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        osc.connect(noteGain);
        noteGain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.5);
      });
    } else {
      // Subtle tactile click/ping
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);

      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gainNode);
      osc.start(now);
      osc.stop(now + 0.08);
    }
  } catch (err) {
    console.warn('[SoundService] Audio playback notice:', err);
  }
}

/**
 * Text to speech synthesizer announcement through laptop speakers
 */
export function speakAnnouncement(text, lang = 'en-IN') {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel(); // Stop any pending speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 1.0;
    utterance.volume = 1.0;
    window.speechSynthesis.speak(utterance);
  }
}

/**
 * Test laptop speaker sound
 */
export function testLaptopSpeaker() {
  getAudioContext();
  playNotificationSound('incident_report');
  setTimeout(() => {
    speakAnnouncement('NER Tactical Command audio is online and operational.');
  }, 400);
}

export default {
  playNotificationSound,
  speakAnnouncement,
  testLaptopSpeaker
};
