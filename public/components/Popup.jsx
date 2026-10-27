import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "../css/Popup.css";

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

// How many popups are open, so the page is only released when the last one closes
let openCount = 0;

// Freeze the page behind the popup: no clicks, keyboard focus, or scrolling, and blur it
function lockPage() {
  openCount += 1;
  if (openCount > 1) return;
  const root = document.getElementById("root");
  const scrollbar = window.innerWidth - document.documentElement.clientWidth;
  if (root) root.inert = true;
  document.body.classList.add("popup-open");
  document.body.style.paddingRight = scrollbar ? `${scrollbar}px` : "";
}

function unlockPage() {
  openCount = Math.max(0, openCount - 1);
  if (openCount > 0) return;
  const root = document.getElementById("root");
  if (root) root.inert = false;
  document.body.classList.remove("popup-open");
  document.body.style.paddingRight = "";
}

/**
 * Centered popup rendered above the whole app.
 * `onClose` runs on Escape, the backdrop, or the close button; pass `dismissible={false}`
 * while an action is in progress to keep it open.
 */
export default function Popup({ label, role = "dialog", onClose, dismissible = true, showClose = true, className = "", children }) {
  const boxRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = dismissible ? onClose : null;

  useEffect(() => {
    const returnTo = document.activeElement;
    lockPage();

    // Start keyboard focus inside the popup
    const first = boxRef.current?.querySelector(FOCUSABLE);
    (first || boxRef.current)?.focus();

    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeRef.current?.();
        return;
      }
      // Keep Tab moving between the popup's own buttons
      if (e.key !== "Tab" || !boxRef.current) return;
      const items = [...boxRef.current.querySelectorAll(FOCUSABLE)];
      if (items.length === 0) return;
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstItem) {
        e.preventDefault();
        lastItem.focus();
      } else if (!e.shiftKey && document.activeElement === lastItem) {
        e.preventDefault();
        firstItem.focus();
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
      unlockPage();
      if (returnTo && document.contains(returnTo)) returnTo.focus();
    };
  }, []);

  return createPortal(
    <div className="popup-back" onMouseDown={(e) => e.target === e.currentTarget && closeRef.current?.()}>
      <div ref={boxRef} className={`popup ${className}`} role={role} aria-modal="true" aria-label={label} tabIndex={-1}>
        {showClose && (
          <button className="popup-close" aria-label="Close" onClick={() => closeRef.current?.()} disabled={!dismissible}>✕</button>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
}
