import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "../../components/AccountContext.js";
import { downloadCsv, downloadPdf, safeName } from "../../Landlord/Logic/Download.js";

const kwh = (n) => `${Number(n).toLocaleString(undefined, { maximumFractionDigits: 1 })} kWh`;
const date = (ts) => new Date(ts).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
const time = (ts) => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const monthName = (ts) => new Date(ts).toLocaleString(undefined, { month: "long", year: "numeric" });

export const format = { kwh, date, time };

// The report's Label / Value rows (same labels as the landlord reports)
function reportSummary(data) {
  const { latest, previous, month } = data;
  return [
    ["Date", latest ? date(latest.timestamp) : "N/A"],
    ["Reading Time", latest ? time(latest.timestamp) : "N/A"],
    ["Reading Value", latest ? kwh(latest.value) : "N/A"],
    ["Last Reading Time", previous ? time(previous.timestamp) : "N/A"],
    ["Last Reading Value", previous ? kwh(previous.value) : "N/A"],
    ["Last Reading Date", previous ? date(previous.timestamp) : "N/A"],
    ["Used This Month", kwh(month.usage)],
    ["Consumption Cost", `GHS ${month.cost.toFixed(2)}`],
  ];
}

const readingsTable = (data) => ({
  title: "Reading history",
  head: ["Date", "Time", "Reading (kWh)"],
  rows: data.readings.map((r) => [date(r.timestamp), time(r.timestamp), r.value]),
});

export default function usePrivateDashboard() {
  const navigate = useNavigate();
  const { tenant } = useAccount();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ok | error
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [range, setRange] = useState("30"); // "7" | "30" days, or "12m"

  const load = useCallback(async () => {
    setStatus((s) => (s === "ok" ? "ok" : "loading")); // keep showing the old figures while refreshing
    try {
      const response = await fetch("/api/tenantDashboard");
      if (!response.ok) throw new Error("Request failed");
      setData(await response.json());
      setStatus("ok");
    } catch (error) {
      console.error("Error loading dashboard:", error);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const filename = `watcal-${safeName(data?.account.username || tenant?.username || "account")}`;

  const downloadReport = async () => {
    setDownloadOpen(false);
    try {
      await downloadPdf({
        filename: `${filename}-report.pdf`,
        context: `Account: ${data.account.username}    Meter: ${data.account.meterSerialNumber || "N/A"}    Period: ${monthName(data.month.start)}`,
        summary: reportSummary(data),
        table: readingsTable(data),
      });
    } catch (error) {
      console.error("Error creating PDF:", error);
      setToast("Could not create the PDF. Please try again.");
    }
  };

  const downloadData = () => {
    setDownloadOpen(false);
    downloadCsv({
      filename: `${filename}-data.csv`,
      summary: [["Account", data.account.username], ["Meter number", data.account.meterSerialNumber || "N/A"], ...reportSummary(data)],
      table: readingsTable(data),
    });
  };

  return {
    username: data?.account.username || tenant?.username,
    data, status, toast, range, setRange,
    monthLabel: data ? monthName(data.month.start) : "",
    hasReadings: !!data?.latest,
    reload: load,
    downloadOpen, openDownload: () => setDownloadOpen(true), closeDownload: () => setDownloadOpen(false),
    downloadReport, downloadData,
    goToPayment: () => navigate("/tenant/payment"),
    closeToast: () => setToast(""),
  };
}
