import React, { useCallback, useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import "../css/Layout.css";            // shared base styles + electric background
import "../Landlord/css/Layout.css";   // sidebar, header and footer for logged-in pages
import { AccountContext } from "./AccountContext.js";
import useIdleLogout from "../Landlord/Logic/useIdleLogout.js";

export const DEFAULT_AVATAR = "/Landlord/images/avatar.png";

/**
 * Sidebar + header layout for logged-in accounts. `config` describes the account type:
 *   role: "landlord" | "tenant"          label: shown above the page title
 *   authPath, logoutPath: API routes     loginPath: where logged-out visitors go
 *   home: logo / brand link              profilePath: Edit profile page, or null
 *   menu: [[path, label, icon], ...]     titles: { "/lowercase/path": "Title" }
 */
export default function AccountLayout({ config, children }) {
  const { role, label, authPath, logoutPath, loginPath, home, profilePath, menu, titles } = config;
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // `navigate` can change identity between renders; keep the latest one in a ref so the
  // login check below only runs once instead of on every page change.
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  const [account, setAccount] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ok | error
  const [drawer, setDrawer] = useState(false);     // side menu on small screens
  const [notice, setNotice] = useState("");

  // Check the session once; send visitors who are not logged in to the matching login page
  const checkAuth = useCallback(async () => {
    setStatus("loading");
    try {
      const response = await fetch(authPath);
      const data = await response.json();
      if (!data.isAuthenticated) {
        navigateRef.current(loginPath, { replace: true, state: { notice: "Please log in to continue." } });
        return;
      }
      setAccount(data[role]);
      setStatus("ok");
    } catch (error) {
      console.error("Error checking authentication:", error);
      setStatus("error");
    }
  }, [authPath, loginPath, role]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Log out after 20 minutes without activity
  useIdleLogout({
    enabled: status === "ok",
    authPath,
    onIdle: async () => {
      await fetch(logoutPath, { method: "POST" }).catch(() => {});
      navigateRef.current(loginPath, { replace: true, state: { notice: "You were logged out after 20 minutes of inactivity." } });
    },
    onExpired: () =>
      navigateRef.current(loginPath, { replace: true, state: { notice: "Your session has ended. Please log in again." } }),
  });

  // Close the small-screen menu when the page changes, or on Escape
  // (starting each page at the top is handled by PageBehaviour)
  useEffect(() => setDrawer(false), [pathname]);
  useEffect(() => {
    if (!drawer) return undefined;
    const onKey = (e) => e.key === "Escape" && setDrawer(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer]);

  const go = (path) => {
    setDrawer(false);
    navigate(path);
  };

  const logout = async () => {
    try {
      const response = await fetch(logoutPath, { method: "POST" });
      if (!response.ok) throw new Error("Logout failed");
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
      setNotice("Logout failed. Please try again.");
    }
  };

  // Pages call this after saving, e.g. updateAccount({ avatar }), so the header and menu update at once
  const updateAccount = useCallback((patch) => setAccount((current) => ({ ...current, ...patch })), []);
  const avatar = account?.avatar || DEFAULT_AVATAR;

  const isActive = (path) => pathname.toLowerCase() === path.toLowerCase();
  const title = titles[pathname.toLowerCase()] || "Dashboard";

  const electric = (
    <div className="electric" aria-hidden="true">
      {[8, 22, 38, 55, 70, 86].map((top, i) => (
        <i key={top} style={{ top: `${top}%`, animationDelay: `${i * 1.3}s`, animationDuration: `${6 + (i % 3) * 2}s` }} />
      ))}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline className="bolt" points="10,0 14,20 8,22 16,45 11,47 20,75 15,77 22,100" />
        <polyline className="bolt b2" points="88,0 84,18 91,20 83,48 88,50 80,80 85,82 78,100" />
      </svg>
    </div>
  );

  if (status !== "ok") {
    return (
      <div className="llayout">
        {electric}
        <div className="lstate">
          {status === "loading" ? (
            <p>Loading your account...</p>
          ) : (
            <>
              <p>We could not reach the server.</p>
              <button className="btn small" onClick={checkAuth}>Try again</button>
            </>
          )}
        </div>
      </div>
    );
  }

  // The profile button opens Edit profile when the account type has one
  const ProfileTag = profilePath ? "button" : "div";
  const profileProps = profilePath ? { onClick: () => go(profilePath) } : {};

  return (
    <AccountContext.Provider
      value={{ account, role, [role]: account, logout, updateAccount, updateLandlord: updateAccount }}
    >
      <div className="llayout">
        {electric}

        {/* SIDEBAR (always visible on large screens, slides in on small ones) */}
        {drawer && <div className="lback" onClick={() => setDrawer(false)} />}
        <aside className={`sidebar ${drawer ? "open" : ""}`}>
          <div className="brand-row">
            <div className="logo" onClick={() => go(home)}>
              <img alt="" src="/images/logo.svg" />
              <span>WatCal</span>
            </div>
            <button className="close" aria-label="Close menu" onClick={() => setDrawer(false)}>✕</button>
          </div>

          <p className="group">Menu</p>
          <nav aria-label={`${label} menu`}>
            {menu.map(([path, itemLabel, icon]) => (
              <button
                key={path}
                className={`nitem ${isActive(path) ? "active" : ""}`}
                aria-current={isActive(path) ? "page" : undefined}
                onClick={() => go(path)}
              >
                <img alt="" src={`/Landlord/images/${icon}`} />
                <span>{itemLabel}</span>
              </button>
            ))}
          </nav>

          <div className="side-bottom">
            <ProfileTag className="profile" {...profileProps}>
              <img className="avatar" alt="" src={avatar} />
              <span>
                <b>{account.username}</b>
                <small>{account.email}</small>
              </span>
            </ProfileTag>

            <button className="nitem logout" onClick={logout}>
              <img alt="" src="/Landlord/images/sign-out-alt.svg" />
              <span>Logout</span>
            </button>
            {notice && <p className="lnotice" role="alert">{notice}</p>}

            <div className="dlegal">
              <span onClick={() => go("/Privacy")}>Privacy Policy</span>
              <i />
              <span onClick={() => go("/Terms")}>Terms of Service</span>
            </div>
          </div>
        </aside>

        {/* CONTENT */}
        <div className="lcontent">
          <header className="ltop">
            <div className="ltop-left">
              <button className="lmenu" aria-label="Open menu" aria-expanded={drawer} onClick={() => setDrawer(true)}>
                <img alt="" src="/Landlord/images/dash.svg" />
              </button>
              <div>
                <p className="crumb">{label}</p>
                <h2>{title}</h2>
              </div>
            </div>

            <ProfileTag className="luser" {...profileProps} {...(profilePath ? { "aria-label": "Edit profile" } : {})}>
              <span>{account.username}</span>
              <img className="avatar" alt="" src={avatar} />
            </ProfileTag>
          </header>

          <main className="lpage">{children || <Outlet />}</main>

          <footer className="lfooter">
            <span>© {new Date().getFullYear()} WatCal. All rights reserved.</span>
            <div>
              <span className="link" onClick={() => go("/Helpdesk")}>Help Desk</span>
              <span className="link" onClick={() => go("/Contactus")}>Contact Us</span>
            </div>
          </footer>
        </div>
      </div>
    </AccountContext.Provider>
  );
}
