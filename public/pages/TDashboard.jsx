import React from "react";
import { useNavigate } from "react-router-dom";
import "../css/TDashboard-index.css";
import useTenantView from "./Logic/TDashboard";
import {
  BarChart, Kpi, RangeTabs, TipsList, changeKpi, dailyPoints, kwh, money, monthlyPoints, pct, timeAgo,
} from "../Landlord/Insights.jsx";

const RANGES = [["7", "7 days"], ["30", "30 days"], ["12m", "12 months"]];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const LONG_WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const SAVING_TIPS = [
  "Switch off lights and appliances when you are not using them.",
  "Unplug chargers and devices that stay on standby.",
  "Use LED bulbs, which use much less electricity.",
  "Keep doors and windows closed when a fan or air conditioner is running.",
];

const when = (ts) =>
  new Date(ts).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

// "View your bill": a read-only dashboard for a tenant in one of a landlord's rooms
export default function TenantView() {
  const navigate = useNavigate();
  const { data, status, error, range, setRange, reload, signOut } = useTenantView();

  if (status === "loading" || (status === "error" && !data)) {
    return (
      <div className="tview">
        <div className="wrap">
          {status === "loading" ? (
            <p className="state">Loading your bill...</p>
          ) : (
            <div className="state">
              <p>We could not load your bill. {error}</p>
              <button className="btn small" onClick={reload}>Try again</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const r = data.room;
  const points = range === "12m" ? monthlyPoints(data.monthly) : dailyPoints(data.daily, Number(range));
  const known = points.filter((p) => p.value !== null).map((p) => p.value);
  const rangeTotal = known.reduce((a, v) => a + v, 0);
  const change = changeKpi(r);
  const month = new Date(data.monthStart).toLocaleDateString("en-GB", { month: "long" });

  return (
    <div className="tview">
      <div className="wrap">
        {/* HEADLINE */}
        <header className="headline">
          <div>
            <p className="eyebrow">Your bill · view only</p>
            <h1>{data.username}</h1>
            <p className="updated">
              Updated {timeAgo(data.generatedAt)}
              <button type="button" onClick={reload}>Refresh</button>
            </p>
          </div>
          <div className="tools">
            {/* Opens the print dialog; choose "Save as PDF" to download */}
            <button type="button" className="btn small" onClick={() => window.print()}>Print / Save bill</button>
            <button type="button" className="outline" onClick={() => navigate("/Helpdesk")}>Contact support</button>
            <button type="button" className="outline" onClick={signOut}>Close</button>
          </div>
        </header>

        <p className="viewonly">
          This page shows your room's electricity use and your part of the building's bill. Your landlord pays the bill and manages the account.
        </p>

        {/* KEY FIGURES */}
        <section className="kpis" aria-label="Key figures">
          <Kpi
            label="Used this month"
            value={r.latest ? kwh(r.monthUsage, "0 kWh") : "--"}
            note={r.lastMonthUsage !== null ? `Since 1 ${month} · last month ${kwh(r.lastMonthUsage)}` : `Since 1 ${month}`}
          />
          <Kpi label="Your part of the bill" value={money(r.billShare)} note={`${pct(r.share)} of the building's use this month, so far`} />
          <Kpi
            label="Forecast for the month"
            value={r.projectedBill === null ? "--" : `≈ ${money(r.projectedBill)}`}
            note={r.projectedUsage === null ? "Needs a few days of readings" : `About ${kwh(r.projectedUsage)} by the end of ${month}`}
          />
          <Kpi label="Compared with last month" value={change.value} note={change.note} tone={change.tone} />
        </section>

        {/* USAGE CHART */}
        <section className="card">
          <div className="card-head">
            <div>
              <h2>{range === "12m" ? "Monthly usage" : "Daily usage"}</h2>
              <p className="sub">Electricity your room used, in kWh. Hover over a bar for details.</p>
            </div>
            <RangeTabs label="Period" value={range} options={RANGES} onChange={setRange} />
          </div>
          <BarChart points={points} label={`Your room's ${range === "12m" ? "monthly" : "daily"} electricity usage`} />
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
              points={data.weekday.map((v, i) => ({ key: WEEKDAYS[i], label: WEEKDAYS[i], title: `Average ${LONG_WEEKDAYS[i]}`, value: v }))}
              label="Your room's average usage by weekday"
              compact
            />
          </section>

          {/* TIPS */}
          <section className="card">
            <div>
              <h2>Tips and alerts</h2>
              <p className="sub">From your room's meter readings.</p>
            </div>
            <TipsList tips={data.tips} empty="Nothing unusual about your room's usage right now." />
            <div className="saving">
              <h3>Ways to save electricity</h3>
              <ul>
                {SAVING_TIPS.map((tip) => (
                  <li key={tip}><span className="check" aria-hidden="true">✓</span>{tip}</li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        {/* READINGS */}
        <section className="card">
          <div className="card-head">
            <div>
              <h2>Meter readings</h2>
              <p className="sub">
                {r.latest
                  ? `Latest ${timeAgo(r.latest.timestamp)}. The meter value is a running total; "Used" is the change since the reading before.`
                  : r.hasMeter ? "No readings from your meter yet." : "Your room's meter isn't connected yet."}
              </p>
            </div>
            <span className={`status ${!r.hasMeter || r.offline ? "warn" : ""}`}>
              <span className={`dot ${!r.hasMeter || r.offline ? "off" : ""}`} aria-hidden="true" />
              {!r.hasMeter ? "Not connected" : r.offline ? "Not reporting" : "Reporting"}
              {!r.electricityStatus && " · power off"}
            </span>
          </div>
          {data.readings.length > 0 && (
            <div className="table-wrap">
              <table className="readings">
                <thead>
                  <tr>
                    <th scope="col">Date and time</th>
                    <th scope="col" className="num">Meter (kWh)</th>
                    <th scope="col" className="num">Used (kWh)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.readings.map((x) => (
                    <tr key={String(x.timestamp)}>
                      <td>{when(x.timestamp)}</td>
                      <td className="num">{x.readingValue.toLocaleString()}</td>
                      <td className="num">{x.used === null ? "--" : x.used}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
