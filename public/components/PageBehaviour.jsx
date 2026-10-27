import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

// Errors to reveal: form messages (role="alert") and field messages (.field-error).
// Popups are skipped; they are already in view.
const ERROR_SELECTOR = '[role="alert"], .field-error';
const RECENT_ACTION_MS = 4000; // only reveal errors caused by something the user just did

// Height of the sticky header covering the top of the page, if any
function headerHeight() {
  const header = document.querySelector(".navbar, .ltop");
  if (!header) return 0;
  const { position } = getComputedStyle(header);
  return position === "sticky" || position === "fixed" ? header.getBoundingClientRect().height : 0;
}

function reveal(el) {
  const top = headerHeight() + 16;
  const rect = el.getBoundingClientRect();
  const fullyVisible = rect.top >= top && rect.bottom <= window.innerHeight - 16;
  if (fullyVisible) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: rect.top + window.scrollY - top - 8, behavior: reduceMotion ? "auto" : "smooth" });
}

/**
 * Site-wide page behaviour, rendered once inside the router:
 *  - every page change (links, back and forward) opens at the top, on the hero
 *  - an error that appears after the user acts (e.g. submitting a form) is scrolled into view
 */
export default function PageBehaviour() {
  const { pathname } = useLocation();

  // We decide where pages open, instead of the browser restoring an old position on back/forward
  useEffect(() => {
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
  }, []);

  // Before the new page is painted, so the middle of it never flashes on screen
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    const root = document.getElementById("root");
    if (!root) return undefined;

    let lastAction = 0;
    const markAction = () => {
      lastAction = Date.now();
    };
    const actions = ["pointerdown", "keydown", "submit"];
    actions.forEach((type) => document.addEventListener(type, markAction, true));

    const seen = new WeakMap(); // element -> last text, so only new or changed errors count
    root.querySelectorAll(ERROR_SELECTOR).forEach((el) => seen.set(el, el.textContent.trim()));

    let frame = 0;
    const scan = () => {
      frame = 0;
      const fresh = [];
      root.querySelectorAll(ERROR_SELECTOR).forEach((el) => {
        const text = el.textContent.trim();
        if (text && seen.get(el) !== text && el.offsetParent !== null) fresh.push(el);
        seen.set(el, text);
      });
      if (!fresh.length || Date.now() - lastAction > RECENT_ACTION_MS) return;
      // Reveal the error nearest the top of the page
      fresh.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
      reveal(fresh[0]);
    };

    const observer = new MutationObserver(() => {
      if (!frame) frame = setTimeout(scan, 0); // a timer, not requestAnimationFrame, which pauses in background tabs
    });
    observer.observe(root, { childList: true, subtree: true, characterData: true });

    return () => {
      observer.disconnect();
      clearTimeout(frame);
      actions.forEach((type) => document.removeEventListener(type, markAction, true));
    };
  }, []);

  return null;
}
