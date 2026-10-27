import React from "react";
import "../css/Login-index.css";
import useRedirectLogin from "./Logic/TDashboardLogin";

export default function RedirectLogin() {
  const {
    landlordId,
    setLandlordId,
    tenantId,
    setTenantId,
    message,
    loading,
    showTenantId,
    toggleShowTenantId,
    handleSubmit,
  } = useRedirectLogin();

  return (
    <div className="login-page">
      <section className="section">
        <div className="card">
          {/* HEADER */}
          <div className="head">
            <img className="lg" alt="" src="/images/lg.png" />
            <h1>Login</h1>
            <p className="text">Welcome! Dear Tenant.</p>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} noValidate>
            {message && <div className="error" role="alert">{message}</div>}

            <div className="fields">
              <label className="field">
                <img alt="" src="/images/user.svg" />
                <input
                  type="text"
                  placeholder="Enter the Landlord ID"
                  value={landlordId}
                  onChange={(e) => setLandlordId(e.target.value)}
                />
              </label>

              <label className="field">
                <img alt="" src="/images/password.svg" />
                <input
                  type={showTenantId ? "text" : "password"}
                  placeholder="Enter your Tenant ID"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                />
                <img
                  className="eye"
                  alt={showTenantId ? "Hide ID" : "Show ID"}
                  src={showTenantId ? "/images/closed-eye-white.png" : "/images/e.png"}
                  onClick={toggleShowTenantId}
                />
              </label>
            </div>

            <div className="rule" />

            <div className="actions">
              <button type="submit" className="btn" disabled={loading}>
                {loading ? "Checking..." : "Login"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}