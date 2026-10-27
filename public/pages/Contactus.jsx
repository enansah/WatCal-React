import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/Contactus-index.css";

const TOPICS = ["Billing question", "Landlord account", "Tenant account", "Technical issue", "Other"];

const INFO = [
  { icon: "/images/mail.svg", title: "Email us", text: "support@WatCal.com", href: "mailto:support@WatCal.com" },
  { icon: "/images/phone.svg", title: "Call us", text: "+233 59 829 6141", href: "tel:+233598296141" },
  { icon: null, title: "Support hours", text: "Mon – Fri, 8:00 AM – 5:00 PM" }, // TODO: set your real hours
];

const SOCIALS = ["facebook", "twitter", "linkedin"];

const EMPTY = { name: "", email: "", topic: TOPICS[0], message: "" };

function validate(f) {
  const e = {};
  if (!f.name.trim()) e.name = "Please enter your name";
  if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = "Please enter a valid email";
  if (f.message.trim().length < 10) e.message = "Message must be at least 10 characters";
  return e;
}

const Clock = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#06cc02" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

function Contact() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);

  const change = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const submit = (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    // TODO: send `form` to your backend / email service here, e.g.
    // await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSent(true);
    setForm(EMPTY);
  };

  return (
    <div className="contact">
      {/* HERO */}
      <section className="section">
        <div className="hero-card">
          <div className="hero-text">
            <div className="eyebrow">Welcome to WatCal</div>
            <h1 className="hero-title">
              BILLING MADE <span className="accent">TRANSPARENT</span>!
            </h1>
            <p className="text">
              At WatCal, we see billing as more than just figures on a page.
              It’s about giving users tools to manage electricity usage effectively.
            </p>
            <p className="text">Welcome to the community.</p>
          </div>

          <div className="hero-media">
            <img className="hero-photo" alt="" src="/images/contactus.png" />
            <img className="hero-art" alt="" src="/images/tr.png" />
          </div>
        </div>
      </section>

      {/* FORM + INFO */}
      <section className="section">
        <div className="grid">
          <form className="panel" onSubmit={submit} noValidate>
            <h2 className="panel-title">Send us a <span className="accent">message</span></h2>
            <p className="text">Fill in the form and our team will get back to you within 24 hours.</p>

            {sent && <div className="success" role="status">Thank you! Your message has been sent.</div>}

            <div className="two">
              <label>
                Name
                <input name="name" value={form.name} onChange={change} placeholder="Your full name" />
                {errors.name && <span className="error">{errors.name}</span>}
              </label>
              <label>
                Email
                <input name="email" type="email" value={form.email} onChange={change} placeholder="you@example.com" />
                {errors.email && <span className="error">{errors.email}</span>}
              </label>
            </div>

            <label>
              Topic
              <select name="topic" value={form.topic} onChange={change}>
                {TOPICS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </label>

            <label>
              Message
              <textarea name="message" rows="5" value={form.message} onChange={change} placeholder="How can we help?" />
              {errors.message && <span className="error">{errors.message}</span>}
            </label>

            <button className="btn" type="submit">Send Message</button>
          </form>

          <div className="info">
            {INFO.map(({ icon, title, text, href }) => {
              const body = (
                <>
                  <div className="info-icon">{icon ? <img alt="" src={icon} /> : <Clock />}</div>
                  <div>
                    <h3>{title}</h3>
                    <p className="text">{text}</p>
                  </div>
                </>
              );
              return href ? (
                <a key={title} className="info-card" href={href}>{body}</a>
              ) : (
                <div key={title} className="info-card">{body}</div>
              );
            })}

            <div className="info-card follow">
              <h3>Follow us</h3>
              <div className="socials">
                {SOCIALS.map((s) => (
                  <div key={s} className="social-dot"><img alt={s} src={`/images/${s}.svg`} /></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK HELP */}
      <section className="section">
        <div className="help-strip">
          <div>
            <h2>Looking for <span className="accent">quick answers?</span></h2>
            <p className="text">Many common questions about bills, accounts and properties are already answered in our Help Desk.</p>
          </div>
          <button className="btn small" onClick={() => navigate("/Helpdesk")}>Visit Help Desk</button>
        </div>
      </section>
    </div>
  );
}

export default Contact;