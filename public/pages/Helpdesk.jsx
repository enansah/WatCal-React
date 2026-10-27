import React from "react";
import "../css/Helpdesk-index.css";
import { useLayout } from "./Logic/LayoutContext";

const FAQS = [
  ["How often are electricity bills generated and distributed?", "Electricity bills are typically generated on a monthly basis and distributed to tenants electronically through their accounts on the website."],
  ["How does the billing sharing website work?", "Our billing sharing website allows landlords and tenants to accurately track and allocate electricity costs based on individual consumption. Landlords can create billing groups and add properties, while tenants can view their usage and make payments through their accounts."],
  ["What should I do if I encounter technical issues with the website?", "If you encounter any technical issues, please contact our customer support team for assistance. We're here to help resolve any issues you may encounter."],
  ["Can I customize the way electricity costs are allocated among tenants?", "Yes, landlords have the flexibility to customise how electricity costs are allocated among tenants based on various factors such as square footage, number of occupants, or usage patterns."],
  ["How does the website handle privacy and data protection?", "We take privacy and data protection seriously and adhere to strict security measures to safeguard your personal information. Please refer to our Privacy Policy for detailed information on how we handle your data."],
  ["How do I add my property to the website for billing sharing?", "Landlords can easily add properties to the website by providing property details such as address, unit numbers, and meter readings."],
];

function Helpdesk() {
  const { openSignup } = useLayout();

  return (
    <div className="help">
      {/* HERO */}
      <section className="section">
        <div className="hero-card">
          <div className="hero-text">
            <h1 className="hero-title">
              Welcome to <span className="accent">WatCal</span> Help Desk!
            </h1>
            <p className="text">
              Our dedicated help desk team is here to assist you with any
              questions or concerns you may have while using our billing
              sharing website.
            </p>
          </div>

          <div className="hero-media">
            <img className="hero-photo" alt="" src="/images/help.png" />
            <img className="hero-art" alt="" src="/images/tr.png" />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="faq-wrap">
          <h2 className="faq-title">
            <span className="accent">Frequently</span> Asked Questions
          </h2>
          <div className="faq-grid">
            {FAQS.map(([q, a]) => (
              <div key={q} className="faq">
                <h3>{q}</h3>
                <div className="hline" />
                <p className="text">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="cta-card">
          <h2 className="cta-title">
            Start your billing with <span className="accent">WatCal today!</span>
          </h2>
          <button className="btn small" onClick={openSignup}>Open Account</button>
        </div>
      </section>
    </div>
  );
}

export default Helpdesk;