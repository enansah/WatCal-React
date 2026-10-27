import React from "react";
import "../css/Signup-index.css";
import { useTSignupLogic } from "./Logic/TSignupLogic";
import { useLayout } from "./Logic/LayoutContext.js";
import GoogleButton from "../components/GoogleButton.jsx";

const Field = ({ label, children }) => (
  <label className="field">
    <b>{label}</b>
    <div className="control">{children}</div>
  </label>
);

function TSignup() {
  const {
    username, setUsername,
    email, setEmail,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    dateOfBirth, setDateOfBirth,
    houseAddress, setHouseAddress,
    meterSerialNumber, setMeterSerialNumber,
    meterType, setMeterType,
    message,
    success,
    loading,
    showPassword,
    showConfirmPassword,
    handleSubmit,
    togglePassword,
    toggleConfirmPassword,
    google,
    leaveGoogle,
    showError,
  } = useTSignupLogic();
  const { openLogin } = useLayout();

  return (
    <div className="signup">
      <section className="section">
        <div className="card">
          {/* HEADER */}
          <div className="head">
            <h1>Sign Up</h1>
            <p className="role">As a Private User</p>
            <p className="text">Create an account to unlock exclusive features to personalize your billing.</p>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} noValidate>
            {message && <div className={success ? "success" : "error"} role="alert">{message}</div>}
            {google && (
              <p className="google-note">
                <img alt="" src="/images/google.svg" />
                <span>Signing up with Google as <b>{google.email}</b>. No password needed.</span>
                <button type="button" onClick={leaveGoogle}>Use a different email</button>
              </p>
            )}

            <div className="fields">
              <Field label="Username">
                <input placeholder="Melissa Peters" value={username} onChange={(e) => setUsername(e.target.value)} />
              </Field>

              <Field label="Email">
                <input type="email" placeholder="melpeters@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} readOnly={!!google} />
              </Field>

              {!google && (<>
              <Field label="Enter password">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="*********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <img
                  className="eye"
                  alt={showPassword ? "Hide password" : "Show password"}
                  src={showPassword ? "/images/closed-eyel.png" : "/images/eye.svg"}
                  onClick={togglePassword}
                />
              </Field>

              <Field label="Confirm password">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="*********"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <img
                  className="eye"
                  alt={showConfirmPassword ? "Hide password" : "Show password"}
                  src={showConfirmPassword ? "/images/closed-eyel.png" : "/images/eye.svg"}
                  onClick={toggleConfirmPassword}
                />
              </Field>
              </>)}

              <Field label="Date of Birth">
                <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
              </Field>

              <Field label="Meter serial number">
                <input placeholder="131xxxxxxx" value={meterSerialNumber} onChange={(e) => setMeterSerialNumber(e.target.value)} />
              </Field>

              <Field label="House address">
                <input placeholder="(Optional)" value={houseAddress} onChange={(e) => setHouseAddress(e.target.value)} />
                <img className="hint" alt="" title="This field is optional" src="/images/question.svg" />
              </Field>

              <Field label="Meter type">
                <select value={meterType} onChange={(e) => setMeterType(e.target.value)}>
                  <option value="">Select meter-type</option>
                  <option value="prepaid">Prepaid</option>
                  <option value="postpaid">Postpaid</option>
                </select>
              </Field>
            </div>

            <div className="rule" />

            <div className="actions">
              <button type="submit" className="btn" disabled={loading}>
                {loading ? "Creating account..." : "Sign Up"}
              </button>
              <button type="button" className="btn-alt" onClick={openLogin}>Login</button>
            </div>

            {!google && (
              <>
                <div className="divider">
                  <span />
                  <p>Or Continue with</p>
                  <span />
                </div>
                <GoogleButton role="tenant" text="signup_with" onMessage={showError} />
              </>
            )}
          </form>
        </div>
      </section>
    </div>
  );
}

export default TSignup;