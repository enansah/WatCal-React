import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { DASHBOARDS } from "../../components/GoogleButton.jsx";

export const useTSignupLogic = () => {
  const navigate = useNavigate();
  // Set when the visitor chose "Continue with Google" but has no account yet
  const google = useLocation().state?.google || null;

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [houseAddress, setHouseAddress] = useState("");
  const [meterSerialNumber, setMeterSerialNumber] = useState("");
  const [meterType, setMeterType] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false); // must be ticked to sign up

  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fill in the name and email from Google
  useEffect(() => {
    if (!google) return;
    setEmail(google.email);
    setUsername((current) => current || google.name);
    setSuccess(true);
    setMessage("Google account confirmed. Fill in your details below to finish creating your account.");
  }, [google?.email]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const needsPassword = !google;
    if (!username.trim() || !email.trim() || (needsPassword && (!password || !confirmPassword)) || !dateOfBirth) {
      setSuccess(false);
      setMessage("Please fill in all required fields.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setSuccess(false);
      setMessage("Please enter a valid email address.");
      return;
    }
    if (needsPassword && password !== confirmPassword) {
      setSuccess(false);
      setMessage("Passwords do not match.");
      return;
    }
    if (!acceptTerms) {
      setSuccess(false);
      setMessage("Please agree to the Terms of Service and Privacy Policy to continue.");
      return;
    }

    setMessage("");
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch("/api/tenantSignup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password: google ? undefined : password,
          dateOfBirth,
          houseAddress,
          meterSerialNumber,
          meterType,
          acceptTerms,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) throw new Error(data.msg || "Registration failed");

      setSuccess(true);
      if (data.loggedIn) {
        setMessage("Account created! Signing you in...");
        setTimeout(() => navigate(DASHBOARDS.tenant), 1000);
      } else {
        setMessage("Account created! Redirecting to login...");
        setTimeout(() => navigate("/TLogin"), 1000);
      }
    } catch (error) {
      console.error(error);
      setMessage(error.message === "Failed to fetch" ? "Cannot reach the server. Please try again." : error.message);
      setLoading(false);
    }
  };

  const togglePassword = () => setShowPassword((prev) => !prev);
  const toggleConfirmPassword = () => setShowConfirmPassword((prev) => !prev);

  return {
    username, setUsername,
    email, setEmail,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    dateOfBirth, setDateOfBirth,
    houseAddress, setHouseAddress,
    meterSerialNumber, setMeterSerialNumber,
    meterType, setMeterType,
    acceptTerms, setAcceptTerms,
    google,
    leaveGoogle: () => {
      setMessage("");
      navigate("/TSignup", { replace: true, state: null });
    },
    message,
    showError: (text) => {
      setSuccess(false);
      setMessage(text);
    },
    success,
    loading,
    showPassword,
    showConfirmPassword,
    handleSubmit,
    togglePassword,
    toggleConfirmPassword,
  };
};