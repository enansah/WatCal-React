import React, { useEffect, useRef } from "react";
import "./css/History-index.css";
import useLandlordHistory, { MONTHS } from "./Logic/History.js";
import Popup from "../components/Popup.jsx";

export default function LandlordHistory() {
  const {
    year, month, label, rooms, status, totals, expanded, downloadFor, deleteFor, deleting, toast,
    canGoNextYear, isFuture, isCurrent, selectMonth, changeYear, reload, toggleExpanded, exportMonth,
    openDownload, closeDownload, openDelete, closeDelete, confirmDelete, downloadReport, downloadData,
    closeToast, format,
  } = useLandlordHistory();

  // Keep the selected month visible when the month row scrolls on small screens
  const monthsRef = useRef(null);
  useEffect(() => {
    const row = monthsRef.current;
    const active = row?.querySelector(".month.active");
    if (row && active) row.scrollLeft = active.offsetLeft - (row.clientWidth - active.offsetWidth) / 2;
  }, [month, year]);

  return (
    <div className="lhistory">
      <div className="wrap">
        {/* HEADLINE */}
        <div className="headline">
          <div>
            <p className="eyebrow">Billing history</p>
            <h1>{label}</h1>
          </div>
          <button className="btn small" onClick={exportMonth} disabled={status !== "ok" || rooms.length === 0}>
            Export month (CSV)
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
            <span className="label">Total consumption</span>
            <b className="value">{status === "ok" ? totals.usage : "--"}</b>
            <span className="note">Across all rooms in {label}</span>
          </div>
          <div className="kpi">
            <span className="label">Estimated cost</span>
            <b className="value">{status === "ok" ? `Gh₵${totals.cost}` : "--"}</b>
            <span className="note">Based on the tiered tariff</span>
          </div>
          <div className="kpi">
            <span className="label">Rooms with readings</span>
            <b className="value">{status === "ok" ? `${totals.active} / ${totals.rooms}` : "--"}</b>
            <span className="note">{totals.top ? `Highest usage: ${totals.top}` : "No usage recorded yet"}</span>
          </div>
        </section>

        {/* ROOMS */}
        <section className="rooms" aria-label={`Rooms in ${label}`}>
          {status === "loading" && <p className="state">Loading {label}...</p>}

          {status === "error" && (
            <div className="state">
              <p>We could not load the history for {label}.</p>
              <button className="btn small" onClick={reload}>Try again</button>
            </div>
          )}

          {status === "ok" && rooms.length === 0 && (
            <p className="state">No rooms yet. Rooms you add will appear here.</p>
          )}

          {status === "ok" && rooms.length > 0 && (
            <div className="table">
              <div className="row head" aria-hidden="true">
                <span>Room</span>
                <span>Usage</span>
                <span>Share</span>
                <span>Est. cost</span>
                <span className="right">Actions</span>
              </div>

              {rooms.map((room) => {
                const open = !!expanded[room._id];
                const empty = room.readings.length === 0;
                return (
                  <article key={room._id} className={`room ${open ? "open" : ""}`}>
                    <div className="row">
                      <div className="name">
                        <b>{room.roomNumber}</b>
                        <small>TenantID {room.uniqueRoomId || "N/A"}</small>
                      </div>
                      <span className="cell" data-label="Usage">{format.kwh(room.usage)}</span>
                      <span className="cell share" data-label="Share">
                        <span className="bar"><i style={{ width: `${room.share}%` }} /></span>
                        <em>{room.share.toFixed(1)}%</em>
                      </span>
                      <span className="cell" data-label="Est. cost">Gh₵{room.cost}</span>
                      <div className="actions">
                        <button className="act view" aria-expanded={open} aria-label={open ? "Hide readings" : "Show readings"} onClick={() => toggleExpanded(room._id)}>
                          <img alt="" src="/Landlord/images/look.svg" />
                        </button>
                        <button className="act download" aria-label="Download" disabled={empty} onClick={() => openDownload(room)}>
                          <img alt="" src="/Landlord/images/download.svg" />
                        </button>
                        <button className="act remove" aria-label="Delete this month's history" disabled={empty} onClick={() => openDelete(room)}>
                          <img alt="" src="/Landlord/images/del.svg" />
                        </button>
                      </div>
                    </div>

                    {open && (
                      <div className="readings">
                        {empty ? (
                          <p className="muted">No readings were recorded for this room in {label}.</p>
                        ) : (
                          <table>
                            <caption>{room.readings.length} reading{room.readings.length === 1 ? "" : "s"} in {label}</caption>
                            <thead>
                              <tr><th>Date</th><th>Time</th><th className="num">Meter reading</th></tr>
                            </thead>
                            <tbody>
                              {room.readings.map((r) => (
                                <tr key={`${r.timestamp}-${r.readingValue}`}>
                                  <td>{format.date(r.timestamp)}</td>
                                  <td>{format.time(r.timestamp)}</td>
                                  <td className="num">{format.kwh(r.readingValue)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* DOWNLOAD DIALOG */}
      {downloadFor && (
        <Popup label="Download" onClose={closeDownload}>
          <h3>Download {downloadFor.roomNumber}</h3>
          <p className="sub">{label}</p>
          <div className="popup-tiles">
            <button className="popup-tile pdf" onClick={() => downloadReport(downloadFor)}>
              <img alt="" src="/Landlord/images/file-pdf-regular 1.svg" />
              <span>Statement</span>
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
        <Popup label="Delete history" role="alertdialog" onClose={closeDelete} dismissible={!deleting}>
          <h3>Delete history</h3>
          <p>
            Delete all {deleteFor.readings.length} reading{deleteFor.readings.length === 1 ? "" : "s"} for{" "}
            <b>{deleteFor.roomNumber}</b> in {label}? This cannot be undone.
          </p>
          <div className="popup-choices">
            <button className="cancel" onClick={closeDelete} disabled={deleting}>Cancel</button>
            <button className="danger" onClick={confirmDelete} disabled={deleting}>{deleting ? "Deleting..." : "Delete"}</button>
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
