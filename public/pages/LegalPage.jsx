import React, { Fragment } from "react";
import useGoBack from "../components/useGoBack.js";
import "../css/Legal.css";

export const CONTACT_EMAIL = "manuelansah955@gmail.com";
export const CONTACT_PHONE = "+233 59 829 6141";

// Content is a list of paragraphs; an array inside it is a bullet list.
function Paragraphs({ content }) {
  return content.map((block, i) =>
    Array.isArray(block) ? (
      <ul key={i}>{block.map((item) => <li key={item}>{item}</li>)}</ul>
    ) : (
      <p key={i}>{block}</p>
    )
  );
}

/**
 * Shared layout for the Privacy and Terms pages.
 * groups: [{ title?, icon?, sections: [[id, title, content], ...] }]. A group without a title shows no heading.
 */
export default function LegalPage({ pill, title, accent, updated, intro, groups, idPrefix }) {
  const goBack = useGoBack("/"); // previous WatCal page, or the home page

  // Scroll so the section's heading sits just below the sticky site header
  const jumpTo = (id) => {
    const el = document.getElementById(`${idPrefix}-${id}`);
    if (!el) return;
    const header = document.querySelector(".navbar")?.getBoundingClientRect().height || 0;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - header - 20, behavior: "smooth" });
  };

  let number = 0;

  return (
    <div className="legalpage">
      <section className="section">
        <div className="wrap">
          {/* HEADER */}
          <header className="legalpage-head">
            <div className="title-pill">
              <button className="back" onClick={goBack} aria-label="Go back">
                <img alt="" src="/images/back.svg" />
              </button>
              <span>{pill}</span>
            </div>
            <h1>{title} <span className="accent">{accent}</span></h1>
            <p className="updated">Last updated: {updated}</p>
            <p className="text">{intro}</p>
          </header>

          <div className="legalpage-body">
            {/* CONTENTS */}
            <nav className="toc" aria-label="On this page">
              <p>On this page</p>
              <ol>
                {groups.map((group) => (
                  <Fragment key={group.title || "main"}>
                    {group.title && <li className="toc-group" aria-hidden="true">{group.title}</li>}
                    {group.sections.map(([id, sectionTitle]) => (
                      <li key={id}><button onClick={() => jumpTo(id)}>{sectionTitle}</button></li>
                    ))}
                  </Fragment>
                ))}
              </ol>
            </nav>

            {/* SECTIONS */}
            <div className="policy">
              {groups.map((group) => (
                <div key={group.title || "main"} className="legal-group">
                  {group.title && (
                    <div className="group-head">
                      {group.icon && <span className="badge" aria-hidden="true"><img alt="" src={`/images/${group.icon}`} /></span>}
                      <h2>{group.title}</h2>
                    </div>
                  )}
                  {group.sections.map(([id, sectionTitle, content]) => {
                    number += 1;
                    return (
                      <section key={id} id={`${idPrefix}-${id}`} className="policy-item" aria-labelledby={`${idPrefix}-${id}-title`}>
                        <h3 id={`${idPrefix}-${id}-title`}><span>{String(number).padStart(2, "0")}</span>{sectionTitle}</h3>
                        <Paragraphs content={content} />
                      </section>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
