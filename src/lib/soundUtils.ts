// Complete Web Audio API synthesizers for stunning notification sound effects.
// Does not depend on any external files or server assets. Works flawlessly inside browser iframes.

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    // Standard and vendor-prefixed AudioContext support
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx!;
}

/**
 * Play synthesized sound effects with custom volume and preset types
 */
export function playNotificationSound(
  type: 'chime' | 'success' | 'alert' | 'bell' | 'pop',
  volumePercent: number = 80
) {
  try {
    const ctx = getAudioContext();
    const destination = ctx.destination;
    const vol = Math.max(0, Math.min(100, volumePercent)) / 100;

    // Master masterGainNode to control volume
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(vol * 0.4, ctx.currentTime); // Normalise master gain to avoid clipping
    masterGain.connect(destination);

    const now = ctx.currentTime;

    switch (type) {
      case 'chime': {
        // High crystal chime
        // First tone
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(1200, now);
        osc1.frequency.exponentialRampToValueAtTime(1500, now + 0.15);
        gain1.gain.setValueAtTime(0.8, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        // Sub tone for resonance
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(900, now);
        gain2.gain.setValueAtTime(0.4, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc1.connect(gain1);
        gain1.connect(masterGain);
        osc2.connect(gain2);
        gain2.connect(masterGain);

        osc1.start(now);
        osc1.stop(now + 0.41);
        osc2.start(now);
        osc2.stop(now + 0.36);
        break;
      }

      case 'success': {
        // Satisfying 4-note ascending bright chord (C5 -> E5 -> G5 -> C6)
        const notes = [523.25, 659.25, 783.99, 1046.50];
        const delayStep = 0.07;

        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * delayStep);
          
          gainNode.gain.setValueAtTime(0, now);
          gainNode.gain.linearRampToValueAtTime(0.6, now + idx * delayStep + 0.02);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * delayStep + 0.4);

          osc.connect(gainNode);
          gainNode.connect(masterGain);

          osc.start(now + idx * delayStep);
          osc.stop(now + idx * delayStep + 0.45);
        });
        break;
      }

      case 'alert': {
        // High attention dual buzzer
        for (let i = 0; i < 2; i++) {
          const oscPlayTime = now + (i * 0.15);
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          osc.type = 'triangle'; // triangle has richer harmonics than sine for alert
          osc.frequency.setValueAtTime(580, oscPlayTime);
          osc.frequency.linearRampToValueAtTime(540, oscPlayTime + 0.1);
          
          gainNode.gain.setValueAtTime(0.8, oscPlayTime);
          gainNode.gain.linearRampToValueAtTime(0.2, oscPlayTime + 0.08);
          gainNode.gain.exponentialRampToValueAtTime(0.001, oscPlayTime + 0.12);

          osc.connect(gainNode);
          gainNode.connect(masterGain);

          osc.start(oscPlayTime);
          osc.stop(oscPlayTime + 0.13);
        }
        break;
      }

      case 'bell': {
        // Deep copper cathedral bell
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(329.63, now); // E4 note

        // Overtones (harmonic partials)
        const overtones = [2, 3, 4.2];
        const overtoneGains = [0.4, 0.25, 0.1];

        overtones.forEach((multiplier, idx) => {
          const otOsc = ctx.createOscillator();
          const otGain = ctx.createGain();
          otOsc.type = 'sine';
          otOsc.frequency.setValueAtTime(329.63 * multiplier, now);
          
          otGain.gain.setValueAtTime(overtoneGains[idx], now);
          otGain.gain.exponentialRampToValueAtTime(0.001, now + (1.2 / multiplier));

          otOsc.connect(otGain);
          otGain.connect(masterGain);
          otOsc.start(now);
          otOsc.stop(now + (1.25 / multiplier));
        });

        gainNode.gain.setValueAtTime(1.0, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

        osc.connect(gainNode);
        gainNode.connect(masterGain);

        osc.start(now);
        osc.stop(now + 1.6);
        break;
      }

      case 'pop': {
        // Cute light pop sound
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sine';
        
        // Rapid bubble pitch sweep from low to high frequency
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(950, now + 0.08);

        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.linearRampToValueAtTime(0.9, now + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

        osc.connect(gainNode);
        gainNode.connect(masterGain);

        osc.start(now);
        osc.stop(now + 0.12);
        break;
      }
    }
  } catch (err) {
    console.warn('Notification audio generation failed or blocked by context constraints', err);
  }
}
