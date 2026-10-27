import React from "react";
import "./css/PrivateDashboard.css";
import usePrivateDashboard, { format } from "./Logic/PrivateDashboard.js";
import Popup from "../components/Popup.jsx";
import {
  BarChart, Kpi, RangeTabs, TipsList, bandNote, changeKpi, dailyPoints, kwh, money, monthlyPoints, timeAgo,
} from "../Landlord/Insights.jsx";

const RANGES = [["7", "7 days"], ["30", "30 days"], ["12m", "12 months"]];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const LONG_WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function Reading({ label, reading }) {
  return (
    <div className="reading-col">
      <p className="reading-label">{label}</p>
      <dl>
        <dt>Date</dt><dd>{reading ? format.date(reading.timestamp) : "N/A"}</dd>
        <dt>Time</dt><dd>{reading ? format.time(reading.timestamp) : "N/A"}</dd>
        <dt>Meter value</dt><dd>{reading ? format.kwh(reading.value) : "N/A"}</dd>
      </dl>
    </div>
  );
}

export default function PrivateDashboard() {
  const {
    username, data, status, toast, range, setRange, monthLabel, hasReadings, reload,
    downloadOpen, openDownload, closeDownload, downloadReport, downloadData,
    goToPayment, closeToast,
  } = usePrivateDashboard();
  const ins = data?.insights;

  const points = !ins ? [] : range === "12m" ? monthlyPoints(ins.monthly) : dailyPoints(ins.daily, Number(range));
  const known = points.filter((p) => p.value !== null).map((p) => p.value);
  const rangeTotal = known.reduce((a, v) => a + v, 0);
  const change = ins ? changeKpi(ins) : null;

  return (
    <div className="tdash">
      <div className="wrap">
        {/* HEADLINE */}
        <header className="headline">
          <div>
            <p className="eyebrow">Overview</p>
            <h1>Welcome back, <span className="accent">{username}</span></h1>
            {ins && (
              <p className="updated">
                Updated {timeAgo(ins.generatedAt)}
                <button type="button" onClick={reload}>Refresh</button>
              </p>
            )}
          </div>
          {data && (
            <div className="meter-chip">
              <span>Meter</span>
              <b>{data.account.meterSerialNumber || "Not set"}</b>
              {data.account.meterType && <em>{data.account.meterType}</em>}
            </div>
          )}
        </header>

        {status === "loading" && <p className="state">Loading your dashboard...</p>}

        {status === "error" && (
          <div className="state">
            <p>We could not load your dashboard.</p>
            <button className="btn small" onClick={reload}>Try again</button>
          </div>
        )}

        {status === "ok" && ins && (
          <>
            {/* KEY FIGURES */}
            <section className="kpis" aria-label="Key figures">
              <Kpi
                label="Used this month"
                value={hasReadings ? kwh(ins.monthUsage, "0 kWh") : "--"}
                note={`Since 1 ${new Date(ins.monthStart).toLocaleDateString("en-GB", { month: "long" })} · ${data.month.readings} reading${data.month.readings === 1 ? "" : "s"}`}
              />
              <Kpi label="Bill so far" value={money(ins.monthCost)} note={bandNote(ins.band)}>
                <button type="button" className="pay" onClick={goToPayment}>Pay</button>
              </Kpi>
              <Kpi
                label="Forecast for the month"
                value={ins.projectedUsage === null ? "--" : `≈ ${money(ins.projectedCost)}`}
                note={ins.projectedUsage === null ? "Needs a few days of readings" : `About ${kwh(ins.projectedUsage)} by the end of the month`}
                tone={ins.band.crossDate ? "warn" : ""}
              />
              <Kpi label="Compared with last month" value={change.value} note={change.note} tone={change.tone} />
            </section>

            {/* USAGE CHART */}
            <section className="card">
              <div className="card-head">
                <div>
                  <h2>{range === "12m" ? "Monthly usage" : "Daily usage"}</h2>
                  <p className="sub">Electricity you used, in kWh. Hover over a bar for details.</p>
                </div>
                <RangeTabs label="Period" value={range} options={RANGES} onChange={setRange} />
              </div>
              <BarChart points={points} label={`Your ${range === "12m" ? "monthly" : "daily"} electricity usage`} />
              {known.length > 0 && (
                <p className="stats">
                  <span>Total <b>{kwh(rangeTotal)}</b></span>
                  <span>Average <b>{kwh(rangeTotal / known.length)}</b> per {range === "12m" ? "month" : "day"}</span>
                  <span>Highest <b>{kwh(Math.max(...known))}</b></span>
                </p>
              )}
            </section>

            <div className="split">
              {/* WEEKDAY PATTERN */}
              <section className="card">
                <div>
                  <h2>Usage by day of the week</h2>
                  <p className="sub">Your average kWh per day over the last 8 weeks.</p>
                </div>
                <BarChart
                  points={ins.weekday.map((v, i) => ({ key: WEEKDAYS[i], label: WEEKDAYS[i], title: `Average ${LONG_WEEKDAYS[i]}`, value: v }))}
                  label="Your average usage by weekday"
                  compact
                />
              </section>

              {/* TIPS */}
              <section className="card">
                <div>
                  <h2>Tips and alerts</h2>
                  <p className="sub">Worked out from your meter readings.</p>
                </div>
                <TipsList tips={ins.tips} />
              </section>
            </div>

            {/* READINGS + EXPORT */}
            <section className="card">
              <div className="card-head">
                <div>
                  <h2>Meter readings</h2>
                  <p className="sub">Your two most recent readings. The meter value is a running total.</p>
                </div>
                <button className="btn small" onClick={openDownload} disabled={!hasReadings}>Export</button>
              </div>
              <div className="readings">
                <Reading label="Latest reading" reading={data.latest} />
                <Reading label="Previous reading" reading={data.previous} />
              </div>
            </section>
          </>
        )}
      </div>

      {/* DOWNLOAD */}
      {downloadOpen && (
        <Popup label="Download" onClose={closeDownload}>
          <h3>Download</h3>
          <p className="sub">Your readings and {monthLabel} summary</p>
          <div className="popup-tiles">
            <button className="popup-tile pdf" onClick={downloadReport}>
              <img alt="" src="/Landlord/images/file-pdf-regular 1.svg" />
              <span>Reports</span>
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
