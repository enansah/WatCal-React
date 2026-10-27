import React from "react";
import "../css/ForgotPassword-index.css";
import useResetPasswordLandlord from "./Logic/Lsetpassword";

export default function ResetPasswordLandlord() {
  const {
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
  } = useResetPasswordLandlord();

  return (
    <div className="forgot">
      <div className="card">
        {/* BRAND */}
        <div className="brand">
          <div className="name">
            <div className="logo"><img alt="" src="/images/dlogo.png" /></div>
            <h1>WatCal</h1>
          </div>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} noValidate>
          <label className="field">
            <b>New Password</b>
            <div className="control">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="*********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <img
                className="eye"
                alt={showPassword ? "Hide password" : "Show password"}
                src={showPassword ? "/images/closed-eye-white.png" : "/images/e.png"}
                onClick={togglePassword}
              />
            </div>
          </label>

          <label className="field">
            <b>Confirm Password</b>
            <div className="control">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="*********"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <img
                className="eye"
                alt={showConfirmPassword ? "Hide password" : "Show password"}
                src={showConfirmPassword ? "/images/closed-eye-white.png" : "/images/e.png"}
                onClick={toggleConfirmPassword}
              />
            </div>
          </label>

          {message && <div className={success ? "success" : "error"} role="alert">{message}</div>}

          <button type="submit" className="btn" disabled={loading}>
            {loading ? "Saving..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
}