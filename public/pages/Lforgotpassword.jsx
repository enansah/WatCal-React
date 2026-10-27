import React from "react";
import "../css/ForgotPassword-index.css";
import useForgotPassword from "./Logic/Lforgotpassword";

export default function ForgotPassword() {
  const { email, message, sent, loading, handleSubmit, handleChange } = useForgotPassword();

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
            <b>Enter Email</b>
            <div className="control">
              <input
                type="email"
                placeholder="melpeters@gmail.com"
                value={email}
                onChange={handleChange}
              />
            </div>
          </label>

          {message && (
            <div className={sent ? "success" : "error"} role={sent ? "status" : "alert"}>{message}</div>
          )}

          <button type="submit" className="btn" disabled={loading}>
            {loading ? "Sending..." : sent ? "Send again" : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
}