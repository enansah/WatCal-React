import React, { useEffect, useRef } from "react";
import "../Landlord/css/History-index.css"; // same look as the landlord History page
import "./css/PrivateHistory.css";
import usePrivateHistory from "./Logic/PrivateHistory.js";
import { MONTHS } from "../Landlord/Logic/History.js";
import { format } from "./Logic/PrivateDashboard.js";
import Popup from "../components/Popup.jsx";

export default function PrivateHistory() {
  const {
    year, month, label, data, status, toast, canGoNextYear, isFuture, isCurrent, selectMonth, changeYear, reload,
    downloadOpen, openDownload, closeDownload, downloadReport, downloadData, closeToast,
  } = usePrivateHistory();

  // Keep the selected month visible when the month row scrolls on small screens
  const monthsRef = useRef(null);
  useEffect(() => {
    const row = monthsRef.current;
    const active = row?.querySelector(".month.active");
    if (row && active) row.scrollLeft = active.offsetLeft - (row.clientWidth - active.offsetWidth) / 2;
  }, [month, year]);

  const ok = status === "ok";
  const readings = ok ? data.readings : [];

  return (
    <div className="lhistory">
      <div className="wrap">
        {/* HEADLINE */}
        <div className="headline">
          <div>
            <p className="eyebrow">Billing history</p>
            <h1>{label}</h1>
          </div>
          <button className="btn small" onClick={openDownload} disabled={!ok || readings.length === 0}>
            Download statement
          </button>
        </div>

        {/* PERIOD PICKER */}
        <section className="period" aria-label="Choose a month">
          <div className="year">
            <button aria-label="Previous year" onClick={() => changeYear(-1)}>‹</button>
            <b>{year}</b>
            <button aria-label="Next year" onClick={() => changeYear(1)} disabled={!canGoNextYear}>›</button>
          </div>
          <div className="months" ref={monthsRef}>
            {MONTHS.map((name, i) => {
              const m = i + 1;
              return (
                <button
                  key={name}
                  className={`month ${m === month ? "active" : ""} ${isCurrent(m) ? "current" : ""}`}
                  aria-pressed={m === month}
                  disabled={isFuture(m)}
                  onClick={() => selectMonth(m)}
                >
                  {name.slice(0, 3)}
                </button>
              );
            })}
          </div>
        </section>

        {/* KEY FIGURES */}
        <section className="kpis" aria-live="polite">
          <div className="kpi">
            <span className="label">Electricity used</span>
            <b className="value">{ok ? format.kwh(data.usage) : "--"}</b>
            <span className="note">In {label}</span>
          </div>
          <div className="kpi">
            <span className="label">Estimated cost</span>
            <b className="value">{ok ? `Gh₵${data.cost.toFixed(2)}` : "--"}</b>
            <span className="note">Based on the tiered tariff</span>
          </div>
          <div className="kpi">
            <span className="label">Meter readings</span>
            <b className="value">{ok ? readings.length : "--"}</b>
            <span className="note">{ok && data.meterSerialNumber ? `Meter ${data.meterSerialNumber}` : "Recorded this month"}</span>
          </div>
        </section>

        {/* READINGS */}
        <section className="phistory-card" aria-label={`Readings in ${label}`}>
          {status === "loading" && <p className="state">Loading {label}...</p>}

          {status === "error" && (
            <div className="state">
              <p>We could not load the history for {label}.</p>
              <button className="btn small" onClick={reload}>Try again</button>
            </div>
          )}

          {ok && readings.length === 0 && (
            <p className="state">No meter readings were recorded in {label}.</p>
          )}

          {ok && readings.length > 0 && (
            <table>
              <caption>{readings.length} reading{readings.length === 1 ? "" : "s"} in {label}, newest first</caption>
              <thead>
                <tr><th>Date</th><th>Time</th><th className="num">Meter reading</th><th className="num">Used since previous</th></tr>
              </thead>
              <tbody>
                {[...readings].reverse().map((r, i, list) => {
                  const older = list[i + 1];
                  return (
                    <tr key={`${r.timestamp}-${r.value}`}>
                      <td>{format.date(r.timestamp)}</td>
                      <td>{format.time(r.timestamp)}</td>
                      <td className="num">{format.kwh(r.value)}</td>
                      <td className="num muted-cell">{older ? format.kwh(Math.max(0, r.value - older.value)) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      </div>

      {/* DOWNLOAD */}
      {downloadOpen && (
        <Popup label="Download" onClose={closeDownload}>
          <h3>Download</h3>
          <p className="sub">{label}</p>
          <div className="popup-tiles">
            <button className="popup-tile pdf" onClick={downloadReport}>
              <img alt="" src="/Landlord/images/file-pdf-regular 1.svg" />
              <span>Statement</span>
            </button>
            <button className="popup-tile csv" onClick={downloadData}>
              <img alt="" src="/Landlord/images/file-csv-solid 1.svg" />
              <span>Data</span>
            </button>
          </div>
        </Popup>
      )}

      {toast && (
        <div className="toast" role="status">
          <span>{toast}</span>
          <button onClick={closeToast}>Close</button>
        </div>
      )}
    </div>
  );
}
