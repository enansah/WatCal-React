import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function useResetPasswordTenant() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const togglePassword = () => setShowPassword((p) => !p);
  const toggleConfirmPassword = () => setShowConfirmPassword((p) => !p);

  const fail = (text) => {
    setSuccess(false);
    setMessage(text);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!token) return fail("This reset link is invalid or has expired.");
    if (!password || !confirmPassword) return fail("Please fill in both password fields.");
    if (password !== confirmPassword) return fail("Passwords do not match.");

    setMessage("");
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch("/api/resetPasswordTenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) throw new Error(data.msg || "Failed to reset password");

      setSuccess(true);
      setMessage("Password updated! Redirecting to login...");
      setTimeout(() => navigate("/TLogin"), 1000);
    } catch (error) {
      console.error(error);
      fail(error.message === "Failed to fetch" ? "Cannot reach the server. Please try again." : error.message);
      setLoading(false);
    }
  };

  return {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    message,
    success,
    loading,
    showPassword,
    showConfirmPassword,
    togglePassword,
    toggleConfirmPassword,
    handleSubmit,
  };
}