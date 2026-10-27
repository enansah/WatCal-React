import React from "react";
import "../css/About-index.css";

const ROWS = [
  {
    title: "Mission",
    img: "/images/leaf-img.png",
    text: "Our mission is to streamline the process of electricity billing for landlords and tenants, providing a user-friendly platform that accurately monitors and allocates costs based on individual consumption. We are dedicated to promoting transparency, fairness, and efficiency in billing practices, ultimately enhancing the financial well-being and satisfaction of both landlords and tenants.",
  },
  {
    title: "Vision",
    img: "/images/sec-eye.png",
    reverse: true,
    text: "Our vision is to create harmonious living environments where billing is seamless, equitable, and fosters sustainable energy practices. Empowering landlords and tenants alike, our billing sharing website revolutionizes the way electricity expenses are managed in homes. By accurately tracking individual consumption, we foster transparency and fairness, ensuring that each party pays only for what they use.",
  },
];

function About() {
  return (
    <div className="about">
      {/* HERO */}
      <section className="section">
        <div className="hero-card">
          <div className="hero-text">
            <div className="eyebrow">Welcome to WatCal</div>
            <h1 className="hero-title">
              BILLING MADE <span className="accent">TRANSPARENT</span>!
            </h1>
            <p className="text">
              With WatCal, we envision billing as more than just numbers on a statement. It's about empowering homeowners, landlords, and tenants to manage their electricity usage efficiently and fairly. As a dedicated platform, we are committed to delivering a seamless billing experience that exceeds expectations. Through innovative technology, personalized solutions, and a commitment to honesty, we aim to revolutionize the way electricity expenses are handled. Join us on this transformative journey and discover a new standard of billing excellence.
            </p>
          </div>

          <div className="hero-media">
            <img className="hero-photo" alt="" src="/images/about.png" />
            <img className="hero-art" alt="" src="/images/tr.png" />
          </div>
        </div>
      </section>

      {/* MISSION & VISION */}
      <section className="section">
        <div className="mission">
          <div className="intro">
            <h2 className="title">Mission &amp; Vision</h2>
            <p className="text">
              At our core, we aspire to be pioneers in the field of electricity billing management, guided by a steadfast commitment to innovation, transparency, and inclusivity. Our vision is to lead the industry by revolutionizing how landlords and tenants interact with electricity expenses, fostering financial empowerment and harmony in homes and businesses alike. We prioritize integrity in our operations, ensuring accuracy and fairness in every transaction. Through our dedication to customer satisfaction and community engagement, we strive to build a brighter, more equitable future where billing is seamless, efficient, and empowering for all.
            </p>
          </div>

          <div className="rows">
            {ROWS.map(({ title, img, text, reverse }) => (
              <div key={title} className={`row ${reverse ? "reverse" : ""}`}>
                <div className="media">
                  <img className="media-bg" alt="" src="/images/bck.png" />
                  <img className="media-img" alt="" src={img} />
                </div>
                <div className="side">
                  <h3>{title}</h3>
                  <p className="text">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;