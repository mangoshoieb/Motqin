// What happens the moment a study session's clock runs out: a short chime
// and a browser notification. The chime is synthesised with the Web Audio
// API so there's no sound file to ship, and it still works when the tab is
// in the background (the timer keeps ticking there).
//
// Browsers only let a page make sound or ask for notifications after a
// user gesture, so `primeSessionAlerts` must be called from the click that
// starts a session — it unlocks the audio context and asks permission once.

let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (typeof window === "undefined") return null;
  try {
    audioContext ??= new AudioContext();
    return audioContext;
  } catch {
    return null;
  }
};

export const primeSessionAlerts = () => {
  const ctx = getAudioContext();
  if (ctx?.state === "suspended") void ctx.resume().catch(() => undefined);

  if (typeof Notification !== "undefined" && Notification.permission === "default") {
    void Notification.requestPermission().catch(() => undefined);
  }
};

// A bell-like "ding-ding-ding": three rising notes, played twice.
export const playSessionChime = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume().catch(() => undefined);

  const notes = [659.25, 783.99, 1046.5]; // E5, G5, C6
  const noteLength = 0.32;
  const start = ctx.currentTime + 0.02;

  [0, 1].forEach((repeat) => {
    notes.forEach((frequency, index) => {
      const at = start + repeat * (notes.length * noteLength + 0.25) + index * noteLength;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, at);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.35, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + noteLength);
      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start(at);
      oscillator.stop(at + noteLength + 0.05);
    });
  });
};

// Length of one chime (two passes of three notes plus the pause between).
const CHIME_SECONDS = 2.3;
export const RING_SECONDS = 20;

/**
 * Rings the chime repeatedly for RING_SECONDS (or until the returned stop
 * function is called — e.g. the student dismissed the finished box).
 */
export const startSessionRing = (): (() => void) => {
  playSessionChime();
  const interval = window.setInterval(playSessionChime, CHIME_SECONDS * 1000);
  const timeout = window.setTimeout(() => window.clearInterval(interval), RING_SECONDS * 1000);
  return () => {
    window.clearInterval(interval);
    window.clearTimeout(timeout);
  };
};

export const notifySessionFinished = (sessionTitle: string) => {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try {
    const notification = new Notification("انتهت الجلسة", {
      body: `${sessionTitle} — حان وقت الاستراحة أو الجلسة التالية`,
      dir: "rtl",
      lang: "ar",
      tag: "motqin-session-finished",
    });
    // Clicking it brings the student back to the board.
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch {
    // Some browsers throw for page-created notifications; the chime and
    // the on-screen state still tell the student.
  }
};
