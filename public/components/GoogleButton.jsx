import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/GoogleButton.css";

// "Continue with Google" using Google Identity Services. The Client ID comes from the server
// (GOOGLE_CLIENT_ID in .env), so the page needs no rebuild when it is added.
const GIS_SRC = "https://accounts.google.com/gsi/client";

export const DASHBOARDS = { landlord: "/Landlord/Dashboard", tenant: "/tenant/dashboard" };
const SIGNUP_PAGES = { landlord: "/LSignup", tenant: "/TSignup" };

let configRequest = null;
let scriptRequest = null;

function getClientId() {
  configRequest ||= fetch("/api/auth/google/config")
    .then((r) => (r.ok ? r.json() : {}))
    .then((d) => d.clientId || null)
    .catch(() => {
      configRequest = null; // try again next time
      return null;
    });
  return configRequest;
}

function loadGoogleScript() {
  scriptRequest ||= new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => {
      scriptRequest = null;
      reject(new Error("Could not load Google sign-in"));
    };
    document.head.appendChild(script);
  });
  return scriptRequest;
}

/**
 * role: "landlord" | "tenant". text: Google's label ("continue_with", "signin_with" or "signup_with").
 * onMessage(text): show an error next to the form.
 */
export default function GoogleButton({ role, text = "continue_with", onMessage }) {
  const navigate = useNavigate();
  const holder = useRef(null);
  const [status, setStatus] = useState("loading"); // loading | ready | off | error
  const [busy, setBusy] = useState(false);

  // Keep the latest props for Google's callback, which is set up once
  const latest = useRef({});
  latest.current = { role, navigate, onMessage };

  useEffect(() => {
    let cancelled = false;

    const handleCredential = async ({ credential }) => {
      const { role: who, navigate: go, onMessage: say } = latest.current;
      setBusy(true);
      try {
        const response = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential, role: who }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.msg || "Google sign-in failed. Please try again.");

        if (data.status === "loggedIn") {
          go(DASHBOARDS[who]);
        } else {
          // New to WatCal: finish signing up with the Google name and email filled in
          go(SIGNUP_PAGES[who], { state: { google: { email: data.email, name: data.name } } });
        }
      } catch (error) {
        say?.(error.message === "Failed to fetch" ? "Cannot reach the server. Please try again." : error.message);
      } finally {
        setBusy(false);
      }
    };

    (async () => {
      const clientId = await getClientId();
      if (cancelled) return;
      if (!clientId) return setStatus("off");
      try {
        await loadGoogleScript();
      } catch {
        if (!cancelled) setStatus("error");
        return;
      }
      if (cancelled || !holder.current) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredential,
        ux_mode: "popup",
        cancel_on_tap_outside: true,
        context: text === "signup_with" ? "signup" : "signin",
      });
      window.google.accounts.id.renderButton(holder.current, {
        theme: "filled_black",
        size: "large",
        shape: "pill",
        text,
        logo_alignment: "left",
        width: Math.max(200, Math.min(320, holder.current.offsetWidth || 320)),
      });
      setStatus("ready");
    })();

    return () => {
      cancelled = true;
    };
  }, [text]);

  const unavailable = status === "off" || status === "error";

  return (
    <div className="google-signin" aria-busy={busy || status === "loading"}>
      {!unavailable && <div ref={holder} className={`gsi-holder ${busy ? "busy" : ""}`} />}
      {unavailable && (
        <button
          type="button"
          className="google-fallback"
          onClick={() =>
            onMessage?.(
              status === "off"
                ? "Google sign-in isn't set up yet. Please use your username and password for now."
                : "Couldn't load Google sign-in. Check your connection and try again."
            )
          }
        >
          <img alt="" src="/images/google.svg" />
          <span>{text === "signup_with" ? "Sign up with Google" : "Continue with Google"}</span>
        </button>
      )}
      {busy && <p className="google-busy" role="status">Signing you in with Google...</p>}
    </div>
  );
}
