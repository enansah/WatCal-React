import React from "react";
import "../css/Signup-index.css";
import { useTSignupLogic } from "./Logic/TSignupLogic";
import { useLayout } from "./Logic/LayoutContext.js";
import GoogleButton from "../components/GoogleButton.jsx";
import { DateOfBirth, EyeButton, Field, FormSection, TermsAgreement } from "./SignupParts.jsx";

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
    acceptTerms, setAcceptTerms,
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

            {/* USER DETAILS */}
            <FormSection id="details-title" title="User details" text="Used to log in and to contact you about your account.">
              <Field label="Username" hint="You'll use this to log in.">
                <input autoComplete="username" placeholder="e.g. Melissa Peters" value={username} onChange={(e) => setUsername(e.target.value)} />
              </Field>
              <Field label="Email" hint={google ? "From your Google account." : "We'll send password resets and receipts here."}>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  readOnly={!!google}
                />
              </Field>
              <DateOfBirth value={dateOfBirth} onChange={setDateOfBirth} />
              <Field label="House address" optional>
                <input autoComplete="street-address" placeholder="e.g. 12 Oxford St, Accra" value={houseAddress} onChange={(e) => setHouseAddress(e.target.value)} />
              </Field>
            </FormSection>

            {/* PASSWORD (not needed when signing up with Google) */}
            {!google && (
              <FormSection id="password-title" title="Password" text="Choose a password you don't use on other websites.">
                <Field label="Password">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <EyeButton shown={showPassword} onClick={togglePassword} />
                </Field>
                <Field label="Confirm password">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Type it again"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <EyeButton shown={showConfirmPassword} onClick={toggleConfirmPassword} />
                </Field>
              </FormSection>
            )}

            {/* YOUR METER */}
            <FormSection
              id="meter-title"
              title="Your meter"
              text="Your readings are matched to this meter number, so add it if you can. You can also add it later in Edit profile."
            >
              <Field label="Meter serial number" optional hint="The number shown on your meter, e.g. in its display or on its label.">
                <input placeholder="e.g. 131xxxxxxx" maxLength={40} value={meterSerialNumber} onChange={(e) => setMeterSerialNumber(e.target.value)} />
              </Field>
              <Field label="Meter type" optional>
                <select value={meterType} onChange={(e) => setMeterType(e.target.value)}>
                  <option value="">Choose prepaid or postpaid</option>
                  <option value="prepaid">Prepaid</option>
                  <option value="postpaid">Postpaid</option>
                </select>
              </Field>
            </FormSection>

            <div className="rule" />

            <TermsAgreement checked={acceptTerms} onChange={setAcceptTerms} />

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