import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { rememberBillIds } from "./TDashboard.js";

export default function useRedirectLogin() {
  const navigate = useNavigate();

  const [landlordId, setLandlordId] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTenantId, setShowTenantId] = useState(false);

  const toggleShowTenantId = () => setShowTenantId((p) => !p);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!landlordId.trim() || !tenantId.trim()) {
      setMessage("Please enter both the Landlord ID and your Tenant ID.");
      return;
    }

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/viewTenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ landlordId: landlordId.trim(), tenantId: tenantId.trim() }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success) {
        // Remember the IDs for this tab only, so the dashboard can load fresh figures (cleared when the tab closes)
        rememberBillIds(landlordId.trim(), tenantId.trim());
        navigate("/Redirect");
      } else {
        // The server explains what went wrong (wrong IDs, too many attempts, ...)
        setMessage(data.message || data.msg || "We couldn't open your bill. Please try again.");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching tenant data:", error);
      setMessage("Cannot reach the server. Please try again.");
      setLoading(false);
    }
  };

  return {
    landlordId,
    setLandlordId,
    tenantId,
    setTenantId,
    message,
    loading,
    showTenantId,
    toggleShowTenantId,
    handleSubmit,
  };
}