import React from "react";
import { useNavigate } from "react-router-dom";
import "../css/Home-index.css";
import { useLayout } from "./Logic/LayoutContext";



const FEATURES = [
  ["briefcase.fill.png", "Navigation", "Easily manage your electricity expenses with our comprehensive billing website. Experience seamless access to detailed consumption data, transparent billing, and convenient payment options. Enjoy features such as personalized usage insights, automated billing notifications, and hassle-free payment processing. Our platform empowers landlords and tenants to efficiently track and settle electricity costs, promoting financial transparency and peace of mind."],
  ["drop.svg", "Energy saving", "Take control of your electricity expenses with our tailored billing solutions designed to fit your unique needs. Whether you're a landlord seeking transparent cost-sharing or a tenant looking for fair and accurate billing, our platform offers flexibility and accuracy to help you manage your energy costs efficiently. From individual consumption tracking to seamless billing processes, we empower you to save both energy and money while promoting sustainable living practices."],
  ["cam.svg", "Reliable", "Management at your comfort of understandable numerical representations and keen tutoring of advance update for users comfort. We seek to make landlord’s adherent to how energy is distributed off his facility and measures to put in place when there are quarrels among individual tenants due to unchecked bill sharing."],
];

const BENEFITS = [
  ["connection.png", "Transparent Compensation", "We provide a competitive salary package that recognizes the skills and expertise of our employees. YourBank believes in rewarding exceptional performance and offering opportunities for financial growth."],
  ["bulb.svg", "Health and Wellness", "We prioritise the financial health and peace of mind of our users by offering transparent and equitable billing solutions. Our platform ensures accuracy and fairness in electricity expenses, empowering landlords and tenants to manage their budgets effectively. We are committed to providing a seamless user experience, supported by innovative technology and exceptional customer service. Just as we prioritise the well-being of our users, we also prioritise the efficiency and reliability of our platform, ensuring a smooth and hassle-free experience for all."],
];

const VALUES = [
  ["Integrity", "We are committed to operating our billing sharing website with unwavering integrity, transparency, and ethical standards. Our dedication to doing what is right for our users, partners, and community guides every decision we make, even in challenging circumstances."],
  ["Customer Centricity", "At the core of our operations lies a commitment to our users. We prioritize understanding their unique billing requirements, offering tailored solutions, and delivering unparalleled service that surpasses their expectations. Our focus remains on empowering landlords and tenants through transparent, efficient, and personalized billing experiences, ensuring their satisfaction and trust in our platform."],
  ["Innovation", "We embrace innovation and continuously evolve to meet the dynamic needs of our users. Our culture encourages creative thinking, challenges traditional approaches, and fosters exploration of new ideas to shape the future of electricity billing."],
];

const FAQS = [
  ["How often are electricity bills generated and distributed?", "Electricity bills are typically generated on a monthly basis and distributed to tenants electronically through their accounts on the website."],
  ["How does the billing sharing website work?", "Our billing sharing website allows landlords and tenants to accurately track and allocate electricity costs based on individual consumption. Landlords can create billing groups and add properties, while tenants can view their usage and make payments through their accounts."],
  ["What should I do if I encounter technical issues with the website?", "If you encounter any technical issues, please contact our customer support team for assistance. We're here to help resolve any issues you may encounter."],
  ["Can I customize the way electricity costs are allocated among tenants?", "Yes, landlords have the flexibility to customise how electricity costs are allocated among tenants based on various factors such as square footage, number of occupants, or usage patterns."],
  ["How does the website handle privacy and data protection?", "We take privacy and data protection seriously and adhere to strict security measures to safeguard your personal information. Please refer to our Privacy Policy for detailed information on how we handle your data."],
  ["How do I add my property to the website for billing sharing?", "Landlords can easily add properties to the website by providing property details such as address, unit numbers, and meter readings."],
];

const Title = ({ plain, accent, className = "" }) => (
  <h2 className={`title ${className}`}>
    {plain} <span className="accent">{accent}</span>
  </h2>
);

const Icon = ({ src }) => (
  <div className="icon-ring">
    <div className="icon-badge">
      <img alt="" src={`/images/${src}`} />
    </div>
  </div>
);

function Home() {
  const { openSignup } = useLayout();
    const navigate = useNavigate(); 

  return (
    <div className="home">
      {/* Decorative wave; its tip touches the bottom of the nav at every screen size */}
      <img className="hero-art-left" alt="" src="/images/top.png" />

      <header className="hero-block">
        {/* HERO */}
        
        <button className="tenant-btn" onClick={() => navigate("/RedirectLogin")}>View your bill as a tenant</button>

        <div className="hero">
          <img className="hero-art-right" alt="" src="/images/ab.png" />
          <div className="welcome">
            <div className="badge">
              <img alt="" src="/images/icon.svg" />
              Secured billing
            </div>
            <h1 className="hero-title">
              <p>Welcome to WatCal</p>
              <p>BILLING MADE <span className="accent">TRANSPARENT</span></p>
            </h1>
            <p className="text small">
              Our mission is to provide comprehensive and transparent billing
              among individual tenants and landlords at various homes.
            </p>
            <button className="btn small" onClick={openSignup}>Open Account</button>
          </div>
        </div>
      </header>

      {/* SERVICES */}
      <section className="section pull-up">
        <div className="inner">
          <Title plain="Our" accent="Services" />
          <p className="text">
            Explore an array of tailored billing solutions at WatCal, crafted to
            meet the diverse needs and preferences of landlords and tenants
            alike. Our platform offers customizable features to accommodate
            various property setups and consumption patterns, ensuring fair and
            transparent billing practices. Experience the convenience of
            managing electricity expenses seamlessly while empowering
            individuals to track and control their usage effectively.
          </p>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section">
        <div className="inner features">
          {FEATURES.map(([icon, title, text], i) => (
            <React.Fragment key={title}>
              {i > 0 && <div className="vline" />}
              <div className="feature">
                <Icon src={icon} />
                <h3>{title}</h3>
                <p className="text">{text}</p>
              </div>
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* BENEFITS + VALUES */}
      <section className="section">
        <div className="inner stack">
          <div className="narrow">
            <Title plain="Our" accent="Benefits" />
            <p className="text">
              At WatCal, we prioritize the well-being and success of our team
              members. We are committed to fostering a supportive and enriching
              work environment where employees thrive. Through a robust range of
              benefits and opportunities, we empower our team to achieve their
              personal and professional aspirations, ensuring their continuous
              growth and fulfillment. By investing in our employees, we
              cultivate a culture of excellence, innovation, and collaboration,
              driving the success of our billing sharing platform and the
              satisfaction of our users.
            </p>
          </div>

          <div className="benefit-cards">
            {BENEFITS.map(([icon, title, text], i) => (
              <React.Fragment key={title}>
                {i > 0 && <div className="vline dashed" />}
                <div className={`card ${i ? "alt" : ""}`}>
                  <div className="card-head">
                    <Icon src={icon} />
                    <h3>{title}</h3>
                  </div>
                  <p className="text">{text}</p>
                </div>
              </React.Fragment>
            ))}
          </div>
          <div className="hline" />

          <div className="narrow">
            <Title plain="Our" accent="Values" />
            <p className="text">
              At WatCal, our values are the cornerstone of our platform, shaping
              every interaction and decision we make. We are committed to
              integrity, ensuring that transparency and honesty govern all
              aspects of our billing process. Exceptional service is at the
              heart of everything we do, as we strive to exceed the expectations
              of landlords and tenants alike through user-friendly interfaces
              and responsive support. Innovation drives us forward, propelling
              us to continually enhance our technology and services to better
              meet the evolving needs of our users. These values are ingrained
              in our culture, guiding our efforts as we work collaboratively to
              simplify billing, promote fairness, and foster sustainable energy
              practices in homes across the globe
            </p>
          </div>

          <div className="values">
            {VALUES.map(([title, text]) => (
              <div key={title} className="value">
                <h3>{title}</h3>
                <p className="text">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="inner stack faq-wrap">
          <div className="narrow">
            <h2 className="title">
              <span className="accent">Frequently</span> Asked Questions
            </h2>
            <p className="text">
              Still you have any questions? Contact our Team via support@WatCal.com
            </p>
          </div>
          <div className="faq-grid">
            {FAQS.map(([q, a]) => (
              <div key={q} className="faq">
                <h4>{q}</h4>
                <div className="hline" />
                <p className="text">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="cta">
          <img className="cta-art" alt="" src="/images/dots.png" />
          <div className="cta-text">
            <h2>
              Start your billing journey with <span className="accent">WatCal today!</span>
            </h2>
            <p className="text">
              Welcome to WatCal, Billing made transparent. We are here to add to
              the comfort our homes. Join as to experience the quality share of
              bills.
            </p>
          </div>
          <button className="btn small" onClick={openSignup}>Open Account</button>
        </div>
      </section>

    </div>
  );
}

export default Home;