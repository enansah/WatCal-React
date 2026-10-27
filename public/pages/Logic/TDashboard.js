import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// The Landlord ID and Tenant ID from the "View your bill" form, kept for this browser tab only
const KEY = "watcal.billIds";

export function rememberBillIds(landlordId, tenantId) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ landlordId, tenantId }));
  } catch {
    /* storage blocked: the dashboard will ask for the IDs again */
  }
}

function readBillIds() {
  try {
    const ids = JSON.parse(sessionStorage.getItem(KEY));
    return ids && ids.landlordId && ids.tenantId ? ids : null;
  } catch {
    return null;
  }
}

function forgetBillIds() {
  try {
    sessionStorage.removeItem(KEY);
    localStorage.removeItem("tenantData"); // left behind by the old version of this page
  } catch {
    /* nothing to clear */
  }
}

// The tenant's view-only dashboard: loads fresh figures each time from the IDs entered on the form
export default function useTenantView() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ok | error
  const [error, setError] = useState("");
  const [range, setRange] = useState("30");        // "7" | "30" days, or "12m"

  const load = useCallback(async () => {
    const ids = readBillIds();
    if (!ids) {
      navigate("/RedirectLogin", { replace: true });
      return;
    }
    setStatus((s) => (s === "ok" ? "ok" : "loading"));
    try {
      const response = await fetch("/api/viewTenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ids),
      });
      const result = await response.json().catch(() => ({}));
      if (response.status === 404) {
        // The room was removed or the IDs changed: start again from the form
        forgetBillIds();
        navigate("/RedirectLogin", { replace: true });
        return;
      }
      if (!response.ok || !result.success) throw new Error(result.message || result.msg || "Request failed");
      setData(result);
      setStatus("ok");
    } catch (err) {
      console.error("Error loading the bill:", err);
      setError(err.message === "Failed to fetch" ? "Cannot reach the server." : err.message);
      setStatus("error");
    }
  }, [navigate]);

  useEffect(() => {
    try {
      localStorage.removeItem("tenantData"); // the old page kept a copy here; no longer needed
    } catch {
      /* ignore */
    }
    load();
  }, [load]);

  return {
    data, status, error, range, setRange,
    reload: load,
    signOut: () => {
      forgetBillIds();
      navigate("/RedirectLogin");
    },
  };
}
