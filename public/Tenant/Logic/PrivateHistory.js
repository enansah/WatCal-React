import { useCallback, useEffect, useRef, useState } from "react";
import { useAccount } from "../../components/AccountContext.js";
import { MONTHS } from "../../Landlord/Logic/History.js";
import { downloadCsv, downloadPdf, safeName } from "../../Landlord/Logic/Download.js";
import { format } from "./PrivateDashboard.js";

const { kwh, date, time } = format;

function reportSummary(data, label) {
  const latest = data.readings[data.readings.length - 1];
  const previous = data.readings[data.readings.length - 2];
  return [
    ["Period", label],
    ["Date", latest ? date(latest.timestamp) : "N/A"],
    ["Reading Time", latest ? time(latest.timestamp) : "N/A"],
    ["Reading Value", latest ? kwh(latest.value) : "N/A"],
    ["Last Reading Time", previous ? time(previous.timestamp) : "N/A"],
    ["Last Reading Value", previous ? kwh(previous.value) : "N/A"],
    ["Last Reading Date", previous ? date(previous.timestamp) : "N/A"],
    ["Monthly Usage", kwh(data.usage)],
    ["Consumption Cost", `GHS ${data.cost.toFixed(2)}`],
  ];
}

const readingsTable = (data, label) => ({
  title: `Readings in ${label}`,
  head: ["Date", "Time", "Reading (kWh)"],
  empty: "No readings this month",
  rows: data.readings.map((r) => [date(r.timestamp), time(r.timestamp), r.value]),
});

export default function usePrivateHistory() {
  const { tenant } = useAccount();
  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth() + 1;

  const [year, setYear] = useState(thisYear);
  const [month, setMonth] = useState(thisMonth);
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ok | error
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [toast, setToast] = useState("");
  const latest = useRef(0); // ignore responses for a month the user has already left

  const label = `${MONTHS[month - 1]} ${year}`;

  const load = useCallback(async () => {
    const request = ++latest.current;
    setStatus("loading");
    try {
      const response = await fetch(`/api/tenantHistory/${month}/${year}`);
      if (!response.ok) throw new Error("Request failed");
      const body = await response.json();
      if (request !== latest.current) return;
      setData(body);
      setStatus("ok");
    } catch (error) {
      console.error("Error fetching history:", error);
      if (request === latest.current) setStatus("error");
    }
  }, [month, year]);

  useEffect(() => {
    load();
  }, [load]);

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

  const filename = `watcal-${safeName(tenant?.username || "account")}-${safeName(label)}`;

  const downloadReport = async () => {
    setDownloadOpen(false);
    try {
      await downloadPdf({
        filename: `${filename}.pdf`,
        title: "Monthly Statement",
        context: `Account: ${tenant?.username}    Meter: ${data.meterSerialNumber || "N/A"}    Period: ${label}`,
        summary: reportSummary(data, label),
        table: readingsTable(data, label),
      });
    } catch (error) {
      console.error("Error creating PDF:", error);
      setToast("Could not create the PDF. Please try again.");
    }
  };

  const downloadData = () => {
    setDownloadOpen(false);
    downloadCsv({
      filename: `${filename}.csv`,
      summary: [["Account", tenant?.username], ["Meter number", data.meterSerialNumber || "N/A"], ...reportSummary(data, label)],
      table: readingsTable(data, label),
    });
  };

  return {
    year, month, label, data, status, toast,
    canGoNextYear: year < thisYear,
    isFuture, isCurrent: (m) => year === thisYear && m === thisMonth,
    selectMonth: setMonth, changeYear, reload: load,
    downloadOpen, openDownload: () => setDownloadOpen(true), closeDownload: () => setDownloadOpen(false),
    downloadReport, downloadData,
    closeToast: () => setToast(""),
  };
}
