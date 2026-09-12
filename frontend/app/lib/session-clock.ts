// The backend knows a session's *status* but not how far its clock has run,
// so a reload would otherwise restart every running/paused session at 00:00.
// We keep a tiny per-session record in localStorage and rebuild the elapsed
// time from it (plus the wall-clock time that passed while it was running).

const KEY_PREFIX = "motqin:session-clock:";

interface SessionClockRecord {
  elapsedSeconds: number;
  running: boolean;
  savedAt: number; // epoch ms
}

const storage = () => (typeof window === "undefined" ? null : window.localStorage);

export const saveSessionClock = (sessionId: string, elapsedSeconds: number, running: boolean) => {
  try {
    const record: SessionClockRecord = { elapsedSeconds, running, savedAt: Date.now() };
    storage()?.setItem(KEY_PREFIX + sessionId, JSON.stringify(record));
  } catch {
    // Storage full / disabled — the clock just won't survive a reload.
  }
};

export const clearSessionClock = (sessionId: string) => {
  try {
    storage()?.removeItem(KEY_PREFIX + sessionId);
  } catch {
    // ignore
  }
};

/**
 * Elapsed seconds for a session as of now, or null when nothing was stored.
 * `serverRunning` decides whether time that passed since the last save counts:
 * a session the server says is paused shouldn't keep growing just because the
 * tab was closed while our last record still said "running".
 */
export const restoreSessionClock = (sessionId: string, serverRunning: boolean): number | null => {
  try {
    const raw = storage()?.getItem(KEY_PREFIX + sessionId);
    if (!raw) return null;
    const record = JSON.parse(raw) as SessionClockRecord;
    const passed = serverRunning && record.running ? Math.floor((Date.now() - record.savedAt) / 1000) : 0;
    return Math.max(0, record.elapsedSeconds + passed);
  } catch {
    return null;
  }
};

/** Fallback when nothing is stored locally: seconds since the server's startTime. */
export const elapsedSinceStart = (startTime?: string | null): number | null => {
  if (!startTime) return null;
  const started = new Date(startTime).getTime();
  if (Number.isNaN(started)) return null;
  return Math.max(0, Math.floor((Date.now() - started) / 1000));
};
