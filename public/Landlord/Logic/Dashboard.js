import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLandlord } from "./LandlordContext.js";

// Usage figures, forecast, room breakdown and tips for the landlord's Dashboard (worked out on the server)
export default function useLandlordDashboard() {
  const navigate = useNavigate();
  const { landlord } = useLandlord();

  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ok | error
  const [range, setRange] = useState("30");        // "7" | "30" days, or "12m"

  const load = useCallback(async () => {
    setStatus((s) => (s === "ok" ? "ok" : "loading")); // keep showing the old figures while refreshing
    try {
      const response = await fetch("/api/landlordInsights");
      if (!response.ok) throw new Error("Request failed");
      setData(await response.json());
      setStatus("ok");
    } catch (error) {
      console.error("Error loading dashboard figures:", error);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Rooms with the highest usage first
  const rooms = data ? [...data.rooms].sort((a, b) => (b.monthUsage ?? -1) - (a.monthUsage ?? -1)) : [];

  return {
    username: landlord?.username,
    landlordId: landlord?.uniqueId,
    data, status, rooms, range,
    setRange,
    reload: load,
    goToPayment: () => navigate("/Landlord/Payment"),
    openRoom: (id) => navigate(`/Landlord/Analysis?room=${encodeURIComponent(id)}`),
  };
}
