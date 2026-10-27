import React, { useEffect, useState } from "react";
import "./css/Analysis-index.css";
import useLandlordAnalysis, { readingRows } from "./Logic/Analysis.js";
import Popup from "../components/Popup.jsx";
import { BarChart, Kpi, RangeTabs, TipsList, dailyPoints, kwh, money, pct, timeAgo } from "./Insights.jsx";

const RANGES = [["7", "7 days"], ["30", "30 days"]];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const LONG_WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function PowerSwitch({ on, onToggle, label }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className={`switch ${on ? "on" : "off"}`} onClick={onToggle}>
      <span className="knob" />
      <span className="sw-text">{on ? "ON" : "OFF"}</span>
    </button>
  );
}

// The room's meter number, with an inline editor. onSave resolves to an error message or "".
function MeterNumber({ room, onSave }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(room.meterId);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Close the editor when another room is selected
  useEffect(() => {
    setEditing(false);
    setValue(room.meterId);
    setError("");
  }, [room._id, room.meterId]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const message = await onSave(room, value);
    setSaving(false);
    setError(message);
    if (!message) setEditing(false);
  };

  if (!editing) {
    return (
      <p className="meter">
        Meter <b className={room.meterId ? "" : "unset"}>{room.meterId || "not set"}</b>
        <button type="button" className="link" onClick={() => setEditing(true)}>{room.meterId ? "Change" : "Add meter number"}</button>
      </p>
    );
  }
  return (
    <form className="meter-form" onSubmit={submit} noValidate>
      <label>
        <span>Meter number</span>
        <input
          autoFocus
          value={value}
          maxLength={40}
          placeholder="As shown in the meter's data, e.g. 12345678"
          onChange={(e) => { setValue(e.target.value); setError(""); }}
          aria-invalid={!!error}
          aria-describedby={`meter-help-${room._id}`}
        />
      </label>
      <button type="submit" className="btn small" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
      <button type="button" className="tool" onClick={() => { setEditing(false); setValue(room.meterId); setError(""); }}>Cancel</button>
      {error ? (
        <p className="field-error" role="alert">{error}</p>
      ) : (
        <p className="help" id={`meter-help-${room._id}`}>Readings from this meter will appear for {room.roomNumber}. Leave empty to unlink it.</p>
      )}
    </form>
  );
}

function compareNote(room) {
  if (room.avgDaily === null) return "Needs a few days of readings";
  if (!room.othersAvgDaily) return "Over the last 30 days";
  const diff = room.avgDaily / room.othersAvgDaily - 1;
  if (Math.abs(diff) < 0.05) return `About the same as your other rooms (${kwh(room.othersAvgDaily)})`;
  return `${pct(Math.abs(diff))} ${diff > 0 ? "more" : "less"} than your other rooms (${kwh(room.othersAvgDaily)})`;
}

export default function LandlordAnalysis() {
  const {
    data, status, rooms, room, tips, range, showAll, toast, downloadFor, deleteFor, reload,
    selectRoom, setRange, togglePower, saveMeter, toggleShowAll, openDownload, closeDownload, openDelete, closeDelete,
    confirmDelete, downloadReport, downloadData, closeToast,
  } = useLandlordAnalysis();

  const rows = room ? readingRows(room.readings) : [];
  const shownRows = showAll ? rows : rows.slice(0, 10);
  const hasOthers = room && room.othersDaily.some((v) => v !== null);

  return (
    <div className="lanalysis">
      <div className="wrap">
        {status === "loading" && <p className="state">Loading rooms...</p>}

        {status === "error" && (
          <div className="state">
            <p>We could not load your rooms.</p>
            <button className="btn small" onClick={reload}>Try again</button>
          </div>
        )}

        {status === "ok" && rooms.length === 0 && (
          <p className="state">No rooms yet. Rooms you add will appear here.</p>
        )}

        {status === "ok" && room && (
          <>
            {/* ROOM PICKER */}
            <nav className="room-tabs" aria-label="Rooms">
              {rooms.map((r) => (
                <button
                  key={r._id}
                  type="button"
                  className={r._id === room._id ? "on" : ""}
                  aria-current={r._id === room._id ? "true" : undefined}
                  onClick={() => selectRoom(r._id)}
                >
                  <span className={`dot ${!r.latest ? "none" : r.offline || !r.electricityStatus ? "off" : ""}`} aria-hidden="true" />
                  <b>{r.roomNumber}</b>
                  <small>{kwh(r.monthUsage, "no data")}</small>
                </button>
              ))}
            </nav>

            {/* ROOM HEADER */}
            <header className="room-head">
              <div>
                <h1>{room.roomNumber}</h1>
                <p className="tenant">Tenant ID <b>{room.uniqueRoomId || "N/A"}</b></p>
                <MeterNumber room={room} onSave={saveMeter} />
              </div>
              <div className="room-tools">
                <span className="power">
                  Electricity
                  <PowerSwitch on={room.electricityStatus} label={`Electricity in ${room.roomNumber}`} onToggle={() => togglePower(room)} />
                </span>
                <button type="button" className="tool" onClick={() => openDownload(room)}>
                  <img alt="" src="/Landlord/images/download.svg" /> Export
                </button>
                <button type="button" className="tool danger" onClick={() => openDelete(room)}>
                  <img alt="" src="/Landlord/images/del.svg" /> Remove
                </button>
              </div>
            </header>

            {/* KEY FIGURES */}
            <section className="kpis" aria-label={`${room.roomNumber} key figures`}>
              <Kpi
                label="Used this month"
                value={room.latest ? kwh(room.monthUsage, "0 kWh") : "--"}
                note={room.lastMonthUsage !== null ? `Last month: ${kwh(room.lastMonthUsage)}` : "No readings for last month"}
              />
              <Kpi label="Share of the bill" value={money(room.billShare)} note={`${pct(room.share)} of all your rooms' usage this month`} />
              <Kpi label="Average per day" value={kwh(room.avgDaily)} note={compareNote(room)} />
              <Kpi
                label="Last reading"
                value={room.latest ? `${room.latest.value.toLocaleString()} kWh` : "--"}
                note={room.latest ? `Meter total · ${timeAgo(room.latest.timestamp)}` : "This meter hasn't sent readings yet"}
                tone={room.offline && room.latest ? "warn" : ""}
              />
            </section>

            {/* DAILY CHART */}
            <section className="card">
              <div className="card-head">
                <div>
                  <h2>Daily usage</h2>
                  <p className="sub">kWh used each day{hasOthers ? ", compared with the average of your other rooms" : ""}.</p>
                </div>
                <RangeTabs label="Period" value={range} options={RANGES} onChange={setRange} />
              </div>
              <BarChart
                points={dailyPoints(room.daily, Number(range))}
                reference={hasOthers ? room.othersDaily.slice(-Number(range)) : null}
                referenceLabel={hasOthers ? "Other rooms' average" : null}
                label={`Daily electricity usage for ${room.roomNumber}`}
              />
            </section>

            <div className="split">
              {/* WEEKDAY PATTERN */}
              <section className="card">
                <div>
                  <h2>Usage by day of the week</h2>
                  <p className="sub">Average kWh per day over the last 8 weeks.</p>
                </div>
                <BarChart
                  points={room.weekday.map((v, i) => ({ key: WEEKDAYS[i], label: WEEKDAYS[i], title: `Average ${LONG_WEEKDAYS[i]}`, value: v }))}
                  label={`Average usage by weekday for ${room.roomNumber}`}
                  compact
                />
              </section>

              {/* TIPS */}
              <section className="card">
                <div>
                  <h2>Tips and alerts</h2>
                  <p className="sub">For {room.roomNumber}, from its meter readings.</p>
                </div>
                <TipsList tips={tips} empty={`Nothing unusual in ${room.roomNumber} right now.`} />
              </section>
            </div>

            {/* READINGS */}
            <section className="card">
              <div className="card-head">
                <div>
                  <h2>Meter readings</h2>
                  <p className="sub">Newest first. The meter value is a running total; "Used" is the change since the reading before.</p>
                </div>
              </div>
              {rows.length === 0 ? (
                <p className="tips-empty">No readings yet.</p>
              ) : (
                <>
                  <div className="table-wrap">
                    <table className="readings">
                      <thead>
                        <tr>
                          <th scope="col">Date</th>
                          <th scope="col">Time</th>
                          <th scope="col" className="num">Meter (kWh)</th>
                          <th scope="col" className="num">Used (kWh)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shownRows.map((r) => (
                          <tr key={String(r.timestamp)}>
                            <td>{new Date(r.timestamp).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</td>
                            <td>{new Date(r.timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</td>
                            <td className="num">{r.readingValue.toLocaleString()}</td>
                            <td className="num">{r.used === null ? "--" : Number(r.used.toFixed(2))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {rows.length > 10 && (
                    <button type="button" className="more" onClick={toggleShowAll}>
                      {showAll ? "Show the latest 10" : `Show all ${rows.length} readings`}
                    </button>
                  )}
                </>
              )}
            </section>
          </>
        )}
      </div>

      {/* DOWNLOAD DIALOG */}
      {downloadFor && (
        <Popup label="Download" onClose={closeDownload}>
          <h3>Download</h3>
          <p className="sub">{downloadFor.roomNumber}</p>
          <div className="popup-tiles">
            <button className="popup-tile pdf" onClick={() => downloadReport(downloadFor)}>
              <img alt="" src="/Landlord/images/file-pdf-regular 1.svg" />
              <span>Reports</span>
            </button>
            <button className="popup-tile csv" onClick={() => downloadData(downloadFor)}>
              <img alt="" src="/Landlord/images/file-csv-solid 1.svg" />
              <span>Data</span>
            </button>
          </div>
        </Popup>
      )}

      {/* DELETE DIALOG */}
      {deleteFor && (
        <Popup label="Remove tenant" role="alertdialog" onClose={closeDelete}>
          <h3>Remove tenant</h3>
          <p>Remove <b>{deleteFor.roomNumber}</b> and its readings? This cannot be undone.</p>
          <div className="popup-choices">
            <button className="cancel" onClick={closeDelete}>Cancel</button>
            <button className="danger" onClick={confirmDelete}>Remove</button>
          </div>
        </Popup>
      )}

      {/* MESSAGE */}
      {toast && (
        <div className="toast" role="status">
          <span>{toast}</span>
          <button onClick={closeToast}>Close</button>
        </div>
      )}
    </div>
  );
}
