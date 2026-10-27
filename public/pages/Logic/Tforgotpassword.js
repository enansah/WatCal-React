import { useState } from "react";

export default function useForgotPasswordTenant() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false); // message is a confirmation, not an error

  const handleChange = (e) => {
    setEmail(e.target.value);
    setMessage("");
    setSent(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const trimmed = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
      setSent(false);
      setMessage("Please enter a valid email address.");
      return;
    }

    setMessage("");
    setSent(false);
    setLoading(true);

    try {
      const response = await fetch("/api/forgotPasswordTenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) throw new Error(data.msg || "Failed to send reset link");

      setSent(true);
      setMessage(data.msg || "If an account exists for that email, we've sent a link to reset your password.");
    } catch (error) {
      console.error(error);
      setMessage(error.message === "Failed to fetch" ? "Cannot reach the server. Please try again." : error.message);
    } finally {
      setLoading(false);
    }
  };

  return { email, message, sent, loading, handleSubmit, handleChange };
}