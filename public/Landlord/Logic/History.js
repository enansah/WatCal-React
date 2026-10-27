import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { calculateCost } from "./Analysis.js";
import { downloadCsv, downloadPdf, safeName } from "./Download.js";

// ---------- helpers ----------

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const time = (ts) => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const date = (ts) => new Date(ts).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
const kwh = (n) => `${Number(n).toLocaleString(undefined, { maximumFractionDigits: 1 })} kWh`;

function decorate(data) {
  const rooms = (Array.isArray(data) ? data : []).map((room) => {
    const usage = Number(room.currentReading) || 0;
    const readings = [...(room.readings || [])].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    return { ...room, usage, readings, cost: calculateCost(usage) };
  });
  const total = rooms.reduce((sum, r) => sum + r.usage, 0);
  return rooms
    .map((r) => ({ ...r, share: total ? (r.usage / total) * 100 : 0 }))
    .sort((a, b) => b.usage - a.usage || String(a.roomNumber).localeCompare(String(b.roomNumber)));
}

// ---------- exports (CSV and PDF) ----------

// The report's Label / Value rows for one room in the chosen month
function reportSummary(room, label) {
  const latest = room.readings[room.readings.length - 1];
  const previous = room.readings[room.readings.length - 2];
  return [
    ["Period", label],
    ["Date", latest ? date(latest.timestamp) : "N/A"],
    ["Reading Time", latest ? time(latest.timestamp) : "N/A"],
    ["Reading Value", latest ? kwh(latest.readingValue) : "N/A"],
    ["Last Reading Time", previous ? time(previous.timestamp) : "N/A"],
    ["Last Reading Value", previous ? kwh(previous.readingValue) : "N/A"],
    ["Last Reading Date", previous ? date(previous.timestamp) : "N/A"],
    ["Monthly Usage", kwh(room.usage)],
    ["Percentage Consumption", `${room.share.toFixed(1)}%`],
    ["Consumption Cost", `GHS ${room.cost}`],
  ];
}

const readingsTable = (room, label) => ({
  title: `Readings in ${label}`,
  head: ["Date", "Time", "Reading (kWh)"],
  empty: "No readings this month",
  rows: room.readings.map((r) => [date(r.timestamp), time(r.timestamp), r.readingValue]),
});

function exportRoomCsv(room, label) {
  downloadCsv({
    filename: `watcal-${safeName(room.roomNumber)}-${safeName(label)}.csv`,
    summary: [["Room", room.roomNumber], ["Tenant ID", room.uniqueRoomId || "N/A"], ...reportSummary(room, label)],
    table: readingsTable(room, label),
  });
}

function exportMonthCsv(rooms, label) {
  const usage = rooms.reduce((sum, r) => sum + r.usage, 0);
  const cost = rooms.reduce((sum, r) => sum + Number(r.cost), 0);
  downloadCsv({
    filename: `watcal-history-${safeName(label)}.csv`,
    summary: [["Period", label], ["Total usage", kwh(usage)], ["Estimated cost", `GHS ${cost.toFixed(2)}`], ["Rooms", rooms.length]],
    table: {
      head: ["Room", "Tenant ID", "Usage (kWh)", "Share (%)", "Estimated cost (GHS)", "Readings"],
      rows: rooms.map((r) => [r.roomNumber, r.uniqueRoomId || "", r.usage, r.share.toFixed(1), r.cost, r.readings.length]),
    },
  });
}

function exportRoomReport(room, label) {
  return downloadPdf({
    filename: `watcal-${safeName(room.roomNumber)}-${safeName(label)}.pdf`,
    title: "Monthly Statement",
    context: `Room: ${room.roomNumber}    Tenant ID: ${room.uniqueRoomId || "N/A"}    Period: ${label}`,
    summary: reportSummary(room, label),
    table: readingsTable(room, label),
  });
}

// ---------- hook ----------

export default function useLandlordHistory() {
  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth() + 1;

  const [year, setYear] = useState(thisYear);
  const [month, setMonth] = useState(thisMonth);
  const [rooms, setRooms] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ok | error
  const [expanded, setExpanded] = useState({});
  const [downloadFor, setDownloadFor] = useState(null);
  const [deleteFor, setDeleteFor] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState("");
  const latest = useRef(0); // ignore responses for a month the user has already left

  const label = `${MONTHS[month - 1]} ${year}`;

  const load = useCallback(async () => {
    const request = ++latest.current;
    setStatus("loading");
    try {
      const response = await fetch(`/api/totalReadingCost/${month}/${year}`);
      if (!response.ok) throw new Error("Request failed");
      const data = await response.json();
      if (request !== latest.current) return;
      setRooms(decorate(data));
      setStatus("ok");
    } catch (error) {
      console.error("Error fetching history:", error);
      if (request === latest.current) setStatus("error");
    }
  }, [month, year]);

  useEffect(() => {
    setExpanded({});
    load();
  }, [load]);

  // Hide the message after a few seconds
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Months after the current one have no data yet
  const isFuture = (m, y = year) => y > thisYear || (y === thisYear && m > thisMonth);

  const changeYear = (step) => {
    const next = year + step;
    if (next > thisYear) return;
    setYear(next);
    if (isFuture(month, next)) setMonth(thisMonth);
  };

  const totals = useMemo(() => {
    const usage = rooms.reduce((sum, r) => sum + r.usage, 0);
    return {
      usage: kwh(usage),
      cost: rooms.reduce((sum, r) => sum + Number(r.cost), 0).toFixed(2),
      active: rooms.filter((r) => r.readings.length > 0).length,
      rooms: rooms.length,
      top: rooms[0] && rooms[0].usage > 0 ? rooms[0].roomNumber : null,
    };
  }, [rooms]);

  const confirmDelete = async () => {
    const room = deleteFor;
    if (!room) return;
    setDeleting(true);
    try {
      const response = await fetch(
        `/api/deleteRoomHistory/${encodeURIComponent(room.roomNumber)}/${month}/${year}`,
        { method: "DELETE" });
      if (!response.ok) throw new Error("Request failed");
      setToast(`${label} history for ${room.roomNumber} was deleted.`);
      load();
    } catch (error) {
      console.error("Error deleting room history:", error);
      setToast("Could not delete the history. Please try again.");
    } finally {
      setDeleting(false);
      setDeleteFor(null);
    }
  };

  const downloadReport = async (room) => {
    setDownloadFor(null);
    try {
      await exportRoomReport(room, label);
    } catch (error) {
      console.error("Error creating PDF:", error);
      setToast("Could not create the PDF. Please try again.");
    }
  };
  const downloadData = (room) => {
    exportRoomCsv(room, label);
    setDownloadFor(null);
  };

  return {
    year, month, label, rooms, status, totals, expanded, downloadFor, deleteFor, deleting, toast,
    canGoNextYear: year < thisYear,
    isFuture, isCurrent: (m) => year === thisYear && m === thisMonth,
    selectMonth: setMonth, changeYear, reload: load,
    toggleExpanded: (id) => setExpanded((e) => ({ ...e, [id]: !e[id] })),
    exportMonth: () => exportMonthCsv(rooms, label),
    openDownload: setDownloadFor, closeDownload: () => setDownloadFor(null),
    openDelete: setDeleteFor, closeDelete: () => !deleting && setDeleteFor(null),
    confirmDelete, downloadReport, downloadData,
    closeToast: () => setToast(""),
    format: { kwh, date, time },
  };
}
