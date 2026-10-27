import React from "react";
import "./css/Dashboard-index.css";
import useLandlordDashboard from "./Logic/Dashboard";
import {
  BarChart, Kpi, RangeTabs, TipsList, bandNote, changeKpi, dailyPoints, kwh, money, monthlyPoints, pct, shortDate, timeAgo,
} from "./Insights.jsx";

const RANGES = [["7", "7 days"], ["30", "30 days"], ["12m", "12 months"]];

export default function LandlordDashboard() {
  const { username, landlordId, data, status, rooms, range, setRange, reload, goToPayment, openRoom } = useLandlordDashboard();
  const b = data?.building;

  const points = !b ? [] : range === "12m" ? monthlyPoints(b.monthly) : dailyPoints(b.daily, Number(range));
  const known = points.filter((p) => p.value !== null).map((p) => p.value);
  const rangeTotal = known.reduce((a, v) => a + v, 0);
  const change = b ? changeKpi(b) : null;

  return (
    <div className="ldash">
      <div className="wrap">
        {/* HEADLINE */}
        <header className="headline">
          <div>
            <p className="eyebrow">Overview</p>
            <h1>Welcome back, <span className="accent">{username}</span></h1>
            {data && (
              <p className="updated">
                Updated {timeAgo(data.generatedAt)}
                <button type="button" onClick={reload}>Refresh</button>
              </p>
            )}
          </div>
          <div className="id-chip">
            <span>LandlordID</span>
            <b>{landlordId}</b>
          </div>
        </header>

        {status === "loading" && <p className="state">Loading your figures...</p>}
        {status === "error" && (
          <div className="error" role="alert">
            We could not load your figures. <button type="button" className="link" onClick={reload}>Try again</button>
          </div>
        )}

        {b && (
          <>
            {/* KEY FIGURES */}
            <section className="kpis" aria-label="Key figures">
              <Kpi label="Used this month" value={kwh(b.monthUsage, "0 kWh")} note={`Since 1 ${new Date(data.monthStart).toLocaleDateString("en-GB", { month: "long" })} · ${rooms.length} room${rooms.length === 1 ? "" : "s"}`} />
              <Kpi label="Bill so far" value={money(b.monthCost)} note={bandNote(b.band)}>
                <button type="button" className="pay" onClick={goToPayment}>Pay now</button>
              </Kpi>
              <Kpi
                label="Forecast for the month"
                value={b.projectedUsage === null ? "--" : `≈ ${money(b.projectedCost)}`}
                note={b.projectedUsage === null ? "Needs a few days of readings" : `About ${kwh(b.projectedUsage)} by the end of the month`}
                tone={b.band.crossDate ? "warn" : ""}
              />
              <Kpi label="Compared with last month" value={change.value} note={change.note} tone={change.tone} />
            </section>

            {/* USAGE CHART */}
            <section className="card">
              <div className="card-head">
                <div>
                  <h2>{range === "12m" ? "Monthly usage" : "Daily usage"}</h2>
                  <p className="sub">All rooms together, in kWh. Hover over a bar for details.</p>
                </div>
                <RangeTabs label="Period" value={range} options={RANGES} onChange={setRange} />
              </div>
              <BarChart points={points} label={`${range === "12m" ? "Monthly" : "Daily"} electricity usage for all rooms`} />
              {known.length > 0 && (
                <p className="stats">
                  <span>Total <b>{kwh(rangeTotal)}</b></span>
                  <span>Average <b>{kwh(rangeTotal / known.length)}</b> per {range === "12m" ? "month" : "day"}</span>
                  <span>Highest <b>{kwh(Math.max(...known))}</b></span>
                </p>
              )}
            </section>

            <div className="split">
              {/* ROOM BREAKDOWN */}
              <section className="card rooms-card">
                <div className="card-head">
                  <div>
                    <h2>Rooms this month</h2>
                    <p className="sub">Each room's share of the bill is based on its share of the usage. Select a room for details.</p>
                  </div>
                </div>
                {rooms.length === 0 ? (
                  <p className="tips-empty">No rooms yet. Add rooms from Edit profile.</p>
                ) : (
                  <div className="table-wrap">
                    <table className="rooms">
                      <thead>
                        <tr>
                          <th scope="col">Room</th>
                          <th scope="col" className="num">Used</th>
                          <th scope="col">Share</th>
                          <th scope="col" className="num">Bill share</th>
                          <th scope="col" className="num">Avg / day</th>
                          <th scope="col">Last reading</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rooms.map((r) => (
                          <tr key={r._id} onClick={() => openRoom(r._id)}>
                            <th scope="row">
                              <button type="button" className="room-link" onClick={(e) => { e.stopPropagation(); openRoom(r._id); }}>
                                <span
                                  className={`dot ${!r.latest ? "none" : r.offline || !r.electricityStatus ? "off" : ""}`}
                                  title={!r.latest ? "No readings yet" : r.offline ? "Meter not reporting" : !r.electricityStatus ? "Electricity switched off" : "Reporting normally"}
                                  aria-hidden="true"
                                />
                                {r.roomNumber}
                                {!r.electricityStatus && <small className="off-tag">Off</small>}
                              </button>
                            </th>
                            <td className="num">{kwh(r.monthUsage)}</td>
                            <td>
                              <span className="share">
                                <span className="share-bar"><i style={{ width: `${Math.round(r.share * 100)}%` }} /></span>
                                {pct(r.share)}
                              </span>
                            </td>
                            <td className="num">{money(r.billShare)}</td>
                            <td className="num">{kwh(r.avgDaily)}</td>
                            <td className={r.offline && r.latest ? "late" : "muted"}>
                              {r.latest ? timeAgo(r.latest.timestamp) : "None yet"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* TIPS */}
              <section className="card tips-card">
                <div>
                  <h2>Tips and alerts</h2>
                  <p className="sub">Worked out from your meter readings{b.band.crossDate ? ` · next band around ${shortDate(b.band.crossDate)}` : ""}.</p>
                </div>
                <TipsList tips={data.tips.slice(0, 6)} />
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
