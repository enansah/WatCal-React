import React, { useEffect, useState } from "react";

// Building blocks shared by the landlord and private-user sign-up pages (styles in css/Signup-index.css)

export const Field = ({ label, optional, hint, children }) => (
  <label className="field">
    <b>
      {label}
      {optional && <span className="optional"> (optional)</span>}
    </b>
    <div className="control">{children}</div>
    {hint && <small className="field-hint">{hint}</small>}
  </label>
);

// A titled group of fields, styled like the room cards
export const FormSection = ({ id, title, text, children }) => (
  <section className="form-section" aria-labelledby={id}>
    <header className="form-section-head">
      <h2 id={id}>{title}</h2>
      {text && <p>{text}</p>}
    </header>
    <div className="form-card fields">{children}</div>
  </section>
);

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 111 }, (_, i) => THIS_YEAR - i); // newest first
const daysIn = (month, year) => new Date(Number(year) || 2000, Number(month), 0).getDate(); // 2000: allows 29 Feb until a year is chosen
const pad = (n) => String(n).padStart(2, "0");

function splitDate(value) {
  const [y, m, d] = String(value || "").split("-");
  return y && m && d ? { day: String(Number(d)), month: String(Number(m)), year: y } : { day: "", month: "", year: "" };
}

/**
 * Date of birth as three dropdowns (Day / Month / Year): easier than a calendar for dates years ago.
 * value / onChange use "YYYY-MM-DD", the same as a date input; onChange("") until all three are chosen.
 */
export function DateOfBirth({ value, onChange, hint }) {
  const [parts, setParts] = useState(() => splitDate(value));

  // Follow outside changes (e.g. the form being reset), without losing a half-filled choice
  useEffect(() => {
    if (value && value !== toValue(parts)) setParts(splitDate(value));
    if (!value && parts.day && parts.month && parts.year) setParts({ day: "", month: "", year: "" });
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  function toValue({ day, month, year }) {
    return day && month && year ? `${year}-${pad(month)}-${pad(day)}` : "";
  }

  const pick = (field) => (e) => {
    const next = { ...parts, [field]: e.target.value };
    // 31 → 30 (or 28/29) when the month or year changes to a shorter month
    if (next.day && next.month && Number(next.day) > daysIn(next.month, next.year)) next.day = String(daysIn(next.month, next.year));
    setParts(next);
    onChange(toValue(next));
  };

  const maxDay = parts.month ? daysIn(parts.month, parts.year) : 31;

  return (
    <fieldset className="field dob">
      <legend><b>Date of birth</b></legend>
      <div className="dob-parts">
        <div className="control">
          <select aria-label="Day" value={parts.day} onChange={pick("day")}>
            <option value="">Day</option>
            {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="control">
          <select aria-label="Month" value={parts.month} onChange={pick("month")}>
            <option value="">Month</option>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div className="control">
          <select aria-label="Year" value={parts.year} onChange={pick("year")}>
            <option value="">Year</option>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>
      {hint && <small className="field-hint">{hint}</small>}
    </fieldset>
  );
}

// Required agreement above the Sign Up button. The links open in a new tab so the form isn't lost.
export const TermsAgreement = ({ checked, onChange }) => (
  <label className="terms">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    <span>
      I agree to the{" "}
      <a href="/Terms" target="_blank" rel="noopener noreferrer">Terms of Service</a> and{" "}
      <a href="/Privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
    </span>
  </label>
);

export const EyeButton = ({ shown, onClick }) => (
  <button type="button" className="eye-btn" aria-label={shown ? "Hide password" : "Show password"} aria-pressed={shown} onClick={onClick}>
    <img className="eye" alt="" src={shown ? "/images/closed-eyel.png" : "/images/eye.svg"} />
  </button>
);
