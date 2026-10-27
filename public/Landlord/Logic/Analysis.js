import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { downloadCsv, downloadPdf, safeName } from "./Download.js";

// ---------- helpers ----------

// Ghana tariff tiers. `upTo` is the cumulative upper limit of each tier. Keep in sync with utils/tariff.js
const TIERS = [
  { upTo: 50, rate: 0.0 },
  { upTo: 150, rate: 0.246 },
  { upTo: 300, rate: 0.3409 },
  { upTo: 600, rate: 0.4642 },
  { upTo: 1000, rate: 0.5693 },
  { upTo: Infinity, rate: 0.6758 },
];

// Each tier only charges for the units that fall inside it. (Also used by History.)
export function calculateCost(consumption) {
  let cost = 0;
  let previous = 0;
  for (const { upTo, rate } of TIERS) {
    if (consumption <= previous) break;
    cost += (Math.min(consumption, upTo) - previous) * rate;
    previous = upTo;
  }
  return cost.toFixed(2);
}

const time = (ts) => new Date(ts).toLocaleTimeString();
const date = (ts) => new Date(ts).toLocaleDateString();
const fixed = (n, places = 2) => (n === null || n === undefined ? "N/A" : n.toFixed(places));

// ---------- exports (CSV and PDF) ----------

// The report's Label / Value rows
function reportSummary(room) {
  return [
    ["Latest reading", room.latest ? `${room.latest.value} kWh` : "N/A"],
    ["Latest reading time", room.latest ? `${date(room.latest.timestamp)} ${time(room.latest.timestamp)}` : "N/A"],
    ["Previous reading", room.previous ? `${room.previous.value} kWh` : "N/A"],
    ["Previous reading time", room.previous ? `${date(room.previous.timestamp)} ${time(room.previous.timestamp)}` : "N/A"],
    ["Used this month", `${fixed(room.monthUsage)} kWh`],
    ["Share of building usage", `${(room.share * 100).toFixed(1)}%`],
    ["Share of this month's bill", `GHS ${fixed(room.billShare)}`],
    ["Average per day (last 30 days)", `${fixed(room.avgDaily)} kWh`],
  ];
}

const readingsTable = (room) => ({
  title: "Reading history",
  head: ["Date", "Time", "Reading (kWh)"],
  rows: [...room.readings].reverse().map((r) => [date(r.timestamp), time(r.timestamp), r.readingValue]),
});

function exportCsv(room) {
  downloadCsv({
    filename: `watcal-${safeName(room.roomNumber)}-data.csv`,
    summary: [["Room", room.roomNumber], ["Tenant ID", room.uniqueRoomId || "N/A"], ...reportSummary(room)],
    table: readingsTable(room),
  });
}

function exportReport(room) {
  return downloadPdf({
    filename: `watcal-${safeName(room.roomNumber)}-report.pdf`,
    context: `Room: ${room.roomNumber}    Tenant ID: ${room.uniqueRoomId || "N/A"}`,
    summary: reportSummary(room),
    table: readingsTable(room),
  });
}

// Newest first, each with the usage since the reading before it
export function readingRows(readings) {
  return readings
    .map((r, i) => ({ ...r, used: i > 0 ? Math.max(0, r.readingValue - readings[i - 1].readingValue) : null }))
    .reverse();
}

// ---------- hook ----------

export default function useLandlordAnalysis() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ok | error
  const [range, setRange] = useState("30");        // "7" | "30" days
  const [showAll, setShowAll] = useState(false);   // all readings instead of the latest 10
  const [downloadFor, setDownloadFor] = useState(null);
  const [deleteFor, setDeleteFor] = useState(null);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    setStatus((s) => (s === "ok" ? "ok" : "loading"));
    try {
      const response = await fetch("/api/landlordInsights");
      if (!response.ok) throw new Error("Request failed");
      setData(await response.json());
      setStatus("ok");
    } catch (error) {
      console.error("Error fetching rooms:", error);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Hide the message after a few seconds
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const rooms = data?.rooms || [];
  // The room in the address (?room=...), otherwise the one using the most this month
  const byUsage = [...rooms].sort((a, b) => (b.monthUsage ?? -1) - (a.monthUsage ?? -1));
  const room = rooms.find((r) => String(r._id) === searchParams.get("room")) || byUsage[0] || null;
  const tips = room ? data.tips.filter((t) => t.roomId === String(room._id)) : [];

  const selectRoom = (id) => {
    setShowAll(false);
    setSearchParams({ room: id }, { replace: true });
  };

  const setRoomPower = (id, on) =>
    setData((d) => ({ ...d, rooms: d.rooms.map((r) => (r._id === id ? { ...r, electricityStatus: on } : r)) }));

  const togglePower = async (target) => {
    const turnOn = !target.electricityStatus;
    setRoomPower(target._id, turnOn);
    try {
      const response = await fetch("/api/updateElectricityStatus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomIds: target._id, disconnect: !turnOn }),
      });
      if (!response.ok) throw new Error("Request failed");
      setToast(`Electricity in ${target.roomNumber} switched ${turnOn ? "on" : "off"}.`);
    } catch (error) {
      console.error("Error updating electricity status:", error);
      setRoomPower(target._id, !turnOn); // put the switch back
      setToast("Could not update the electricity status. Please try again.");
    }
  };

  // Link (or unlink, with "") the meter whose readings go to a room. Resolves to an error message, or "" when saved.
  const saveMeter = async (target, meterId) => {
    try {
      const response = await fetch("/api/roomMeter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: target._id, meterId: meterId.trim() }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) return result.msg || "Could not save the meter number. Please try again.";
      setToast(
        result.meterId
          ? `Meter ${result.meterId} linked to ${target.roomNumber}${result.imported ? `; ${result.imported} earlier reading${result.imported === 1 ? "" : "s"} added` : ""}.`
          : `Meter removed from ${target.roomNumber}.`
      );
      load(); // figures change when readings arrive
      return "";
    } catch (error) {
      console.error("Error saving meter number:", error);
      return "Could not reach the server. Please try again.";
    }
  };

  const confirmDelete = async () => {
    const target = deleteFor;
    setDeleteFor(null);
    if (!target) return;
    try {
      const response = await fetch(`/api/room/${encodeURIComponent(target.roomNumber)}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Request failed");
      setSearchParams({}, { replace: true });
      setToast("Room removed successfully!");
      load(); // shares and tips change when a room goes
    } catch (error) {
      console.error("Error deleting room:", error);
      setToast("Failed to remove the room. Please try again.");
    }
  };

  const downloadReport = async (target) => {
    setDownloadFor(null);
    try {
      await exportReport(target);
    } catch (error) {
      console.error("Error creating PDF:", error);
      setToast("Could not create the PDF. Please try again.");
    }
  };
  const downloadData = (target) => {
    exportCsv(target);
    setDownloadFor(null);
  };

  return {
    data, status, rooms, room, tips, range, showAll, toast, downloadFor, deleteFor,
    reload: load,
    selectRoom, setRange, togglePower, saveMeter,
    toggleShowAll: () => setShowAll((s) => !s),
    openDownload: setDownloadFor, closeDownload: () => setDownloadFor(null),
    openDelete: setDeleteFor, closeDelete: () => setDeleteFor(null),
    confirmDelete, downloadReport, downloadData,
    closeToast: () => setToast(""),
  };
}
