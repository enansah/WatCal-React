import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "../../components/AccountContext.js";

// Flip to true once a payment provider is connected in submitPayment below
export const PAYMENTS_ENABLED = false;

export const METER_TYPES = [
  { id: "prepaid", label: "Prepaid", image: "pre.png", note: "Buy credit before you use it" },
  { id: "postpaid", label: "Postpaid", image: "post.png", note: "Pay your bill after use" },
];

// Ghana mobile money networks and the number prefixes that belong to them
export const PROVIDERS = [
  { id: "mtn", label: "MTN MoMo", logo: "mtn.png", prefixes: ["024", "025", "053", "054", "055", "059"] },
  { id: "telecel", label: "Telecel Cash", logo: "telecel.png", prefixes: ["020", "050"] },
];

const PHONE = /^0\d{9}$/;

// Placeholder for the real payment API. When connecting a provider:
//  1. POST the details to a backend route that calls createPayment() for a landlord, or createTenantPayment()
//     for a private user (src/controllers/paymentReceipts.js), and starts the mobile money request;
//     return { success, message }.
//  2. When the provider confirms the payment (usually a webhook), call markPaymentPaid(paymentId, reference).
//     That emails the receipts: each of a landlord's tenants gets their share; a private user gets their own.
async function submitPayment() {
  throw new Error("Online payment is not connected yet.");
}

// Where each account type's amount owed comes from, and its wording.
// readTotals(response) -> { amount: "12.34", kwh: number }
export const LANDLORD_PAYMENT = {
  totalsUrl: "/api/landlordInsights", // same figures as the Dashboard's "Bill so far"
  readTotals: (d) => ({ amount: d.building.monthCost.toFixed(2), kwh: d.building.monthUsage }),
  totalLabel: "This month's bill so far",
  kwhNote: "used across all your rooms this month",
  note: "Once your payment is confirmed, each of your tenants is emailed a receipt confirming the bill is paid in full, with their share of it (based on their share of this month's usage).",
  backPath: "/Landlord/Dashboard",
};
export const PRIVATE_USER_PAYMENT = {
  totalsUrl: "/api/tenantDashboard",
  readTotals: (d) => ({ amount: d.month.cost.toFixed(2), kwh: d.month.usage }),
  totalLabel: "This month's estimated bill",
  kwhNote: "used so far this month",
  note: "The amount is worked out from your meter readings and the tiered electricity tariff. Your meter number is filled in from your profile.",
  backPath: "/tenant/dashboard",
};

export default function useAccountPayment(config = LANDLORD_PAYMENT) {
  const navigate = useNavigate();
  const { account } = useAccount(); // the logged-in account (landlord or private user)

  const [totals, setTotals] = useState({ status: "loading", cost: "Ghs--", kwh: null, amount: "" });
  const [meterType, setMeterType] = useState(account?.meterType || "");
  const [provider, setProvider] = useState("");
  const [form, setForm] = useState({ phone: "", amount: "", meter: account?.meterSerialNumber || "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // summary shown in the confirmation popup

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(config.totalsUrl);
        if (!response.ok) throw new Error("Request failed");
        const data = await response.json();
        if (cancelled) return;
        const { amount, kwh } = config.readTotals(data);
        setTotals({ status: "ok", cost: `Gh₵${amount}`, kwh, amount });
        setForm((f) => (f.amount ? f : { ...f, amount: Number(amount) > 0 ? amount : "" }));
      } catch (error) {
        console.error("Error fetching total reading and cost:", error);
        if (!cancelled) setTotals({ status: "error", cost: "Gh₵--", kwh: null, amount: "" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [config]);

  const setField = (field) => (e) => {
    const value = field === "phone" ? e.target.value.replace(/[^\d]/g, "").slice(0, 10) : e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((er) => ({ ...er, [field]: undefined }));
  };

  const chooseProvider = (id) => {
    setProvider(id);
    setErrors((er) => ({ ...er, provider: undefined, phone: undefined }));
  };

  const validate = () => {
    const next = {};
    const chosen = PROVIDERS.find((p) => p.id === provider);
    if (!chosen) next.provider = "Choose MTN MoMo or Telecel Cash.";
    if (!PHONE.test(form.phone)) next.phone = "Enter a 10-digit mobile number, e.g. 0241234567.";
    else if (chosen && !chosen.prefixes.includes(form.phone.slice(0, 3))) next.phone = `That number is not on ${chosen.label}.`;
    const amount = Number(form.amount);
    if (!form.amount || !Number.isFinite(amount) || amount <= 0) next.amount = "Enter an amount greater than 0.";
    else if (!/^\d+(\.\d{1,2})?$/.test(form.amount)) next.amount = "Use at most 2 decimal places.";
    if (!form.meter.trim()) next.meter = "Enter your meter number.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const details = {
      meterType,
      provider: PROVIDERS.find((p) => p.id === provider).label,
      phone: form.phone,
      amount: Number(form.amount).toFixed(2),
      meter: form.meter.trim(),
    };
    setSubmitting(true);
    try {
      const data = await submitPayment(details);
      setResult({ ok: true, details, message: data.message || "Payment request sent. Approve it on your phone." });
    } catch (error) {
      setResult({ ok: false, details, message: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  return {
    totals, meterType, provider, form, errors, submitting, result,
    chooseMeterType: setMeterType,
    chooseProvider, setField, submit,
    fillTotal: () => setForm((f) => ({ ...f, amount: totals.amount })),
    closeResult: () => setResult(null),
    goBack: () => (window.history.length > 1 ? navigate(-1) : navigate(config.backPath)),
  };
}
