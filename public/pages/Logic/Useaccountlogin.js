import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// `authCheck` (optional): an "is logged in" endpoint; when it says yes, skip the form and open the dashboard
// `role` ("landlord" | "tenant") tells "Continue with Google" which kind of account to use
export function useAccountLogin({ role, endpoint, dashboard, forgotPassword, authCheck }) {
  const navigate = useNavigate();
  const notice = useLocation().state?.notice || ""; // e.g. why the user was logged out

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authCheck) return undefined;
    let cancelled = false;
    fetch(authCheck)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.isAuthenticated) navigate(dashboard, { replace: true });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [authCheck, dashboard, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!username.trim() || !password) {
      setMessage("Please enter your username and password");
      return;
    }

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.error("Login failed:", data.msg);
        setMessage("Sign in failed. Please check your username and password.");
        return;
      }

      localStorage.setItem("username", username.trim());
      navigate(dashboard);
    } catch (error) {
      console.error(error);
      setMessage("Cannot reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);
  const goToForgotPassword = () => navigate(forgotPassword);

  return {
    username,
    setUsername,
    password,
    setPassword,
    role,
    message,
    setMessage,
    notice,
    showPassword,
    loading,
    handleLogin,
    togglePasswordVisibility,
    goToForgotPassword,
  };
}