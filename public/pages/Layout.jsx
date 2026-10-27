import React, { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import "../css/Layout.css";
import { LayoutContext } from "./Logic/LayoutContext";
import Popup from "../components/Popup.jsx";
import { CONTACT_EMAIL, CONTACT_PHONE } from "./LegalPage.jsx";

const NAV = [
  ["/", "Home"],
  ["/Helpdesk", "Help Desk"],
  ["/About", "About"],
  ["/Security", "Security"],
  ["/Contactus", "Contact Us"],
];

const POPUPS = {
  login: [["/TLogin", "As a Private User"], ["/LLogin", "As a Landlord"]],
  signup: [["/TSignup", "As a Private User"], ["/LSignup", "As a Landlord"]],
};

// Social pages shown in the footer as [name, url]; a matching icon must exist in /images
// (e.g. ["Facebook", "https://facebook.com/yourpage"]). Leave the list empty to hide the icons.
const SOCIALS = [];


function Layout({ children }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [popup, setPopup] = useState(null); // "login" | "signup" | null
  const [menuOpen, setMenuOpen] = useState(false);
  // { avatar, dashboard } while a landlord or private user is logged in
  const [account, setAccount] = useState(null);

  // On each page, check whether someone is still logged in so the header can offer a way back
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const landlord = await fetch("/api/landlordIsAuthenticated").then((r) => r.json());
      if (landlord.isAuthenticated) return { avatar: landlord.landlord.avatar, dashboard: "/Landlord/Dashboard" };
      const tenant = await fetch("/api/tenantIsAuthenticated").then((r) => r.json());
      if (tenant.isAuthenticated) return { avatar: tenant.tenant.avatar, dashboard: "/tenant/dashboard" };
      return null;
    };
    check()
      .then((found) => !cancelled && setAccount(found))
      .catch(() => !cancelled && setAccount(null));
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const go = (path) => {
    setPopup(null);
    setMenuOpen(false);
    navigate(path);
  };
  const isActive = (path) => pathname.toLowerCase() === path.toLowerCase();

  return (
    <LayoutContext.Provider value={{ openSignup: () => setPopup("signup"), openLogin: () => setPopup("login") }}>
      <div className="layout">
        {/* ELECTRIC BACKGROUND */}
        <div className="electric" aria-hidden="true">
          {[8, 22, 38, 55, 70, 86].map((top, i) => (
            <i key={top} style={{ top: `${top}%`, animationDelay: `${i * 1.3}s`, animationDuration: `${6 + (i % 3) * 2}s` }} />
          ))}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            <polyline className="bolt" points="10,0 14,20 8,22 16,45 11,47 20,75 15,77 22,100" />
            <polyline className="bolt b2" points="88,0 84,18 91,20 83,48 88,50 80,80 85,82 78,100" />
          </svg>
        </div>

        {/* NAVBAR */}
        <header className="navbar">
          <div className="logo" onClick={() => go("/")}>
            <img alt="" src="/images/logo.svg" />
            <span>WatCal</span>
          </div>

          <nav className={`nav-links ${menuOpen ? "open" : ""}`}>
            {NAV.map(([path, label]) => (
              <div key={path} className={`link ${isActive(path) ? "active" : ""}`} onClick={() => go(path)}>
                {label}
              </div>
            ))}
          </nav>

          <div className="nav-actions">
            {account ? (
              <button className="btn dash-btn" onClick={() => go(account.dashboard)}>
                <img alt="" src={account.avatar || "/Landlord/images/avatar.png"} />
                Dashboard
              </button>
            ) : (
              <>
                <button className="btn-ghost" onClick={() => setPopup("signup")}>Sign Up</button>
                <button className="btn" onClick={() => setPopup("login")}>Login</button>
              </>
            )}
            <button className="menu-btn" aria-label="Menu" onClick={() => setMenuOpen((o) => !o)}>
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="page">{children || <Outlet />}</main>

        {/* FOOTER */}
        <footer className="footer">
          <div className="ft-inner">
            <div className="ft-top">
              <div className="ft-brand">
                <button className="ft-logo" onClick={() => go("/")} aria-label="WatCal home">
                  <img alt="" src="/images/biglogo.svg" />
                  <span>WatCal</span>
                </button>
                <p>Transparent electricity billing for landlords and tenants. Fair shares, clear statements, no surprises.</p>
                {SOCIALS.length > 0 && (
                  <div className="ft-socials">
                    {SOCIALS.map(([name, url]) => (
                      <a key={name} href={url} target="_blank" rel="noopener noreferrer" aria-label={`WatCal on ${name}`}>
                        <img alt="" src={`/images/${name.toLowerCase()}.svg`} />
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <nav className="ft-col" aria-label="Explore">
                <h2>Explore</h2>
                {NAV.map(([path, label]) => (
                  <button key={path} className={isActive(path) ? "active" : ""} onClick={() => go(path)}>{label}</button>
                ))}
              </nav>

              <div className="ft-col">
                <h2>Account</h2>
                {account ? (
                  <button onClick={() => go(account.dashboard)}>Go to dashboard</button>
                ) : (
                  <>
                    <button onClick={() => setPopup("login")}>Log in</button>
                    <button onClick={() => setPopup("signup")}>Create an account</button>
                  </>
                )}
                <button onClick={() => go("/RedirectLogin")}>View your bill as a tenant</button>
              </div>

              <div className="ft-col">
                <h2>Contact</h2>
                <a href={`mailto:${CONTACT_EMAIL}`}><img alt="" src="/images/mail.svg" />{CONTACT_EMAIL}</a>
                <a href={`tel:${CONTACT_PHONE.replace(/ /g, "")}`}><img alt="" src="/images/phone.svg" />{CONTACT_PHONE}</a>
                <button onClick={() => go("/Contactus")}>Send us a message</button>
              </div>
            </div>

            <div className="ft-bottom">
              <span>© {new Date().getFullYear()} WatCal. All rights reserved.</span>
              <div className="ft-legal">
                <button onClick={() => go("/Privacy")}>Privacy Policy</button>
                <button onClick={() => go("/Terms")}>Terms of Service</button>
              </div>
            </div>
          </div>
        </footer>

        {/* LOGIN / SIGN UP POPUP */}
        {popup && (
          <Popup
            label={popup === "login" ? "Login" : "Sign up"}
            onClose={() => setPopup(null)}
            showClose={false}
            className={`modal ${popup === "login" ? "solid" : "outline"}`}
          >
            {POPUPS[popup].map(([path, label]) => (
              <button key={path} className="option" onClick={() => go(path)}>{label}</button>
            ))}
          </Popup>
        )}
      </div>
    </LayoutContext.Provider>
  );
}

export default Layout;