import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { DASHBOARDS } from "../../components/GoogleButton.jsx";

const EMAIL = /^\S+@\S+\.\S+$/;
const METER = /^[A-Za-z0-9 -]{1,40}$/; // same rule as the server (utils/meters.js)
// Meter numbers match ignoring spaces, letter case and leading zeros, as on the server
const meterKey = (m) => m.replace(/\s+/g, "").toUpperCase().replace(/^0+(?=.)/, "");
const newRoom = () => ({ room: "", email: "", meter: "" });

export default function useLSignupLogic() {
  const navigate = useNavigate();
  // Set when the visitor chose "Continue with Google" but has no account yet
  const google = useLocation().state?.google || null;

  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState([newRoom(), newRoom()]);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    dateOfBirth: "",
    houseAddress: "",
    meterSerialNumber: "",
    meterType: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Inputs use their `name` attribute as the key
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const addRoom = () => setRooms([...rooms, newRoom()]);
  const removeRoom = (index) => setRooms(rooms.filter((_, i) => i !== index));
  const handleRoomChange = (index, field, value) =>
    setRooms(rooms.map((r, i) => (i === index ? { ...r, [field]: value } : r)));

  const toggleShowPassword = () => setShowPassword((p) => !p);
  const toggleShowConfirm = () => setShowConfirm((p) => !p);

  const fail = (text) => {
    setSuccess(false);
    setMessage(text);
  };

  // Fill in the name and email from Google
  useEffect(() => {
    if (!google) return;
    setFormData((f) => ({ ...f, email: google.email, username: f.username || google.name }));
    setSuccess(true);
    setMessage("Google account confirmed. Fill in your details below to finish creating your account.");
  }, [google?.email]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const { username, email, password, confirmPassword, dateOfBirth } = formData;

    const needsPassword = !google;
    if (!username.trim() || !email.trim() || (needsPassword && (!password || !confirmPassword)) || !dateOfBirth) {
      return fail("Please fill in all required fields.");
    }
    if (!EMAIL.test(email.trim())) return fail("Please enter a valid email address.");
    if (needsPassword && password !== confirmPassword) return fail("Passwords do not match.");

    const filledRooms = rooms.filter((r) => r.room.trim());
    if (filledRooms.length < 2) return fail("You must add at least two rooms.");
    const noEmail = filledRooms.find((r) => !EMAIL.test(r.email.trim()));
    if (noEmail) return fail(`Enter a valid tenant email for ${noEmail.room.trim()}.`);

    // Meter numbers are optional; any that are given must be valid and different
    const withMeter = filledRooms.filter((r) => r.meter.trim());
    const badMeter = withMeter.find((r) => !METER.test(r.meter.trim()));
    if (badMeter) return fail(`${badMeter.room.trim()}: a meter number can only contain letters, digits, spaces and dashes.`);
    const seen = new Map();
    for (const r of withMeter) {
      const key = meterKey(r.meter.trim());
      if (seen.has(key)) return fail(`${seen.get(key)} and ${r.room.trim()} have the same meter number. Each room needs its own meter.`);
      seen.set(key, r.room.trim());
    }

    setMessage("");
    setSuccess(false);
    setLoading(true);

    try {
      const res = await fetch("/api/landlordSignup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          password: google ? undefined : password,
          confirmPassword: undefined,
          username: username.trim(),
          email: email.trim(),
          roomsData: filledRooms.map((r) => ({ room: r.room.trim(), email: r.email.trim(), meter: r.meter.trim() })),
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data.msg || "Signup failed");

      setSuccess(true);
      if (data.loggedIn) {
        setMessage("Account created! Signing you in...");
        setTimeout(() => navigate(DASHBOARDS.landlord), 1000);
      } else {
        setMessage("Account created! Redirecting to login...");
        setTimeout(() => navigate("/LLogin"), 1000);
      }
    } catch (err) {
      console.error(err);
      fail(err.message === "Failed to fetch" ? "Cannot reach the server. Please try again." : err.message);
      setLoading(false);
    }
  };

  return {
    formData,
    handleChange,
    handleSubmit,
    rooms,
    addRoom,
    removeRoom,
    handleRoomChange,
    google,
    leaveGoogle: () => {
      setMessage("");
      navigate("/LSignup", { replace: true, state: null });
    },
    showError: fail,
    message,
    success,
    loading,
    showPassword,
    toggleShowPassword,
    showConfirm,
    toggleShowConfirm,
  };
}