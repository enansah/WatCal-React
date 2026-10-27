import React from "react";
import "../css/Login-index.css";
import { useLayout } from "./Logic/LayoutContext.js";
import GoogleButton from "../components/GoogleButton.jsx";

// Shared by the landlord and tenant login pages; each passes in its own login logic.
function LoginForm({ logic }) {
  const {
    username,
    setUsername,
    password,
    setPassword,
    role,
    message,
    setMessage,
    notice,
    showPassword,
    handleLogin,
    togglePasswordVisibility,
    goToForgotPassword,
    loading,
  } = logic;
  const { openSignup } = useLayout();

  return (
    <div className="login-page">
      <section className="section">
        <div className="card">
          {/* HEADER */}
          <div className="head">
            <h1>Login</h1>
            <p className="text">Welcome back! Please log in to access your account.</p>
          </div>

          {/* FORM */}
          <form onSubmit={handleLogin}>
            {message && <div className="error" role="alert">{message}</div>}
            {!message && notice && <div className="notice" role="status">{notice}</div>}

            <div className="fields">
              <label className="field">
                <img alt="" src="/images/user.svg" />
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </label>

              <label className="field">
                <img alt="" src="/images/password.svg" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <img
                  className="eye"
                  alt={showPassword ? "Hide password" : "Show password"}
                  src={showPassword ? "/images/closed-eye-white.png" : "/images/e.png"}
                  onClick={togglePasswordVisibility}
                />
              </label>
            </div>

            <div className="rule" />

            <button type="button" className="forgot" onClick={goToForgotPassword}>
              Forgot Password?
            </button>

            <div className="actions">
              <button type="submit" className="btn" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </button>
              <button type="button" className="btn-alt" onClick={openSignup}>Sign Up</button>
            </div>

            <div className="divider">
              <span />
              <p>Or Continue with</p>
              <span />
            </div>

            <GoogleButton role={role} text="continue_with" onMessage={setMessage} />
          </form>
        </div>
      </section>
    </div>
  );
}


export default LoginForm;