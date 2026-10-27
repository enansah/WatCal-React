import { useEffect, useRef } from "react";

// Matches SESSION_IDLE_MS in app.js
export const IDLE_LIMIT_MS = 20 * 60 * 1000;
const PING_EVERY_MS = 5 * 60 * 1000;  // keep the server session alive while the user is active
const CHECK_EVERY_MS = 15 * 1000;
const STORAGE_KEY = "watcal:lastActivity"; // shared by all open tabs
const ACTIVITY = ["pointerdown", "pointermove", "keydown", "wheel", "touchstart", "scroll"];

const readShared = () => {
  try {
    return Number(localStorage.getItem(STORAGE_KEY)) || 0;
  } catch {
    return 0;
  }
};
const writeShared = (time) => {
  try {
    localStorage.setItem(STORAGE_KEY, String(time));
  } catch {
    // storage blocked; this tab still tracks its own activity
  }
};

/**
 * Calls `onIdle` after IDLE_LIMIT_MS with no mouse, keyboard, touch or scroll activity in any tab,
 * and `onExpired` if the server says the session has already ended.
 */
export default function useIdleLogout({ enabled, onIdle, onExpired, authPath = "/api/landlordIsAuthenticated" }) {
  const handlers = useRef({ onIdle, onExpired });
  handlers.current = { onIdle, onExpired };

  useEffect(() => {
    if (!enabled) return undefined;

    let lastActivity = Date.now();
    let lastShared = lastActivity;
    let lastPing = lastActivity;
    let finished = false;
    writeShared(lastActivity);

    const markActive = () => {
      lastActivity = Date.now();
      if (lastActivity - lastShared > 5000) {
        writeShared(lastActivity);
        lastShared = lastActivity;
      }
    };

    const check = async () => {
      if (finished) return;
      const now = Date.now();
      const shared = readShared();
      // Ignore a time from the future (e.g. after the system clock changed) so it can't block the logout
      const latest = Math.max(Math.min(lastActivity, now), shared <= now ? shared : 0);

      if (now - latest >= IDLE_LIMIT_MS) {
        finished = true;
        handlers.current.onIdle();
        return;
      }

      // Active since the last ping: touch the server so its 20-minute timer restarts too
      if (latest > lastPing && now - lastPing >= PING_EVERY_MS) {
        lastPing = now;
        try {
          const data = await (await fetch(authPath)).json();
          if (!data.isAuthenticated && !finished) {
            finished = true;
            handlers.current.onExpired();
          }
        } catch {
          // offline; try again on the next check
        }
      }
    };

    const onVisible = () => document.visibilityState === "visible" && check();

    ACTIVITY.forEach((type) => window.addEventListener(type, markActive, { passive: true }));
    document.addEventListener("visibilitychange", onVisible);
    const timer = setInterval(check, CHECK_EVERY_MS);

    return () => {
      ACTIVITY.forEach((type) => window.removeEventListener(type, markActive));
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(timer);
    };
  }, [enabled, authPath]);
}
