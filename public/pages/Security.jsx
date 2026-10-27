import React from "react";
import "../css/Security-index.css";

// IMPORTANT: every statement below describes a security practice. Make sure each one is
// true for your system before publishing, and edit or remove anything that isn't.
const PROTECTIONS = [
  { icon: "box.svg", title: "Data Masking", text: "Protect sensitive information from unauthorised users." },
  { icon: "layers.svg", title: "Encryption", text: "Secure data using encryption protocols." },
  // VERIFY the four cards below
  { icon: "box.svg", title: "Secure Connections", text: "All traffic between your device and WatCal travels over an encrypted HTTPS connection." },
  { icon: "layers.svg", title: "Password Protection", text: "Passwords are stored in a hashed form, never as plain text." },
  { icon: "box.svg", title: "Role-Based Access", text: "Landlords and tenants only see the properties, bills and usage that belong to them." },
  { icon: "layers.svg", title: "Regular Backups", text: "Account and billing data is backed up regularly so it can be restored if something goes wrong." },
];

const DATA_STEPS = [
  { title: "We collect only what we need", text: "Account details, property information and electricity usage needed to produce accurate bills." },
  { title: "We store it securely", text: "Your data is kept on protected systems with encryption and restricted access." },
  { title: "Access is limited", text: "Only you and the people linked to your property can see your billing information." },
  { title: "You stay in control", text: "Contact us to update or request removal of your personal information." },
];

const SAFETY_TIPS = [
  "Use a strong, unique password for your WatCal account.",
  "Never share your username or password with anyone.",
  "Log out when using a shared or public device.",
  "Be careful with emails or messages asking for your login details.",
];

const SECURITY_FAQS = [
  ["Who can see my electricity usage and bills?", "Tenants see their own usage and bills. Landlords see the properties and billing groups they manage."],
  ["What should I do if I forget my password?", "Use the “Forgot Password?” link on the login page and follow the instructions to reset it."],
  ["What should I do if I think my account was accessed by someone else?", "Change your password straight away and contact our support team so we can help secure your account."],
  ["How do I report a security concern?", "Email our team using the address below. Please include as much detail as you can."],
];

const SECURITY_EMAIL = "support@WatCal.com"; // TODO: use a dedicated address such as security@WatCal.com
const LAST_REVIEWED = "October 2026"; // TODO: update when you actually review this page

function Security() {
  return (
    <div className="security">
      {/* HERO */}
      <section className="section">
        <div className="hero-card">
          <div className="hero-text">
            <h1 className="hero-title">
              Your Security is Our <span className="accent">Top Priority</span>
            </h1>
            <p className="text">
              At WatCal, we recognise the significance of safeguarding your
              electricity usage and billing information.
            </p>
          </div>

          <div className="hero-media">
            <img className="hero-photo" alt="" src="/images/security.png" />
            <img className="hero-art" alt="" src="/images/tr.png" />
          </div>
        </div>
      </section>

      {/* PROTECTIONS */}
      <section className="section">
        <div className="block">
          <div className="intro">
            <h2 className="title">How We <span className="accent">Protect You</span></h2>
            <p className="text">We prioritise the security and privacy of your data.</p>
          </div>
          <div className="divider" />
          <div className="cards">
            {PROTECTIONS.map(({ icon, title, text }) => (
              <div key={title} className="card">
                <div className="card-head">
                  <div className="icon-ring">
                    <div className="icon-badge"><img alt="" src={`/images/${icon}`} /></div>
                  </div>
                  <h3>{title}</h3>
                </div>
                <p className="text">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DATA HANDLING */}
      <section className="section">
        <div className="block">
          <div className="intro">
            <h2 className="title">How We Handle <span className="accent">Your Data</span></h2>
            <p className="text">A simple look at what happens to your information.</p>
          </div>
          <div className="steps">
            {DATA_STEPS.map(({ title, text }, i) => (
              <div key={title} className="step">
                <div className="step-num">{i + 1}</div>
                <h3>{title}</h3>
                <p className="text">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SAFETY TIPS */}
      <section className="section">
        <div className="block">
          <div className="intro">
            <h2 className="title">Keep Your Account <span className="accent">Safe</span></h2>
            <p className="text">Security is a team effort. A few habits go a long way.</p>
          </div>
          <div className="tips">
            {SAFETY_TIPS.map((tip) => (
              <div key={tip} className="tip">
                <span className="check" aria-hidden="true">✓</span>
                <p className="text">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="block">
          <h2 className="title"><span className="accent">Security</span> Questions</h2>
          <div className="faq-grid">
            {SECURITY_FAQS.map(([q, a]) => (
              <div key={q} className="faq">
                <h3>{q}</h3>
                <div className="hline" />
                <p className="text">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REPORT AN ISSUE */}
      <section className="section">
        <div className="report">
          <div>
            <h2>Found a <span className="accent">security issue?</span></h2>
            <p className="text">
              Tell us right away. We take every report seriously and will respond as soon as we can.
            </p>
          </div>
          <a className="btn small" href={`mailto:${SECURITY_EMAIL}`}>Report an Issue</a>
        </div>
      </section>

      <p className="updated">Security practices last reviewed: {LAST_REVIEWED}</p>
    </div>
  );
}

export default Security;