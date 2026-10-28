import React from "react";
import "../css/Signup-index.css";
import useLSignupLogic from "./Logic/LSignupLogic";
import { useLayout } from "./Logic/LayoutContext.js";
import GoogleButton from "../components/GoogleButton.jsx";
import { DateOfBirth, EyeButton, Field, FormSection, TermsAgreement } from "./SignupParts.jsx";


export default function LSignup() {
  const {
    formData,
    handleChange,
    handleSubmit,
    rooms,
    addRoom,
    removeRoom,
    handleRoomChange,
    acceptTerms,
    setAcceptTerms,
    message,
    success,
    loading,
    showPassword,
    toggleShowPassword,
    showConfirm,
    toggleShowConfirm,
    google,
    leaveGoogle,
    showError,
  } = useLSignupLogic();
  const { openLogin } = useLayout();

  return (
    <div className="signup">
      <section className="section">
        <div className="card">
          {/* HEADER */}
          <div className="head">
            <h1>Sign Up</h1>
            <p className="role">As a Landlord</p>
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
                <input name="username" autoComplete="username" placeholder="e.g. Melissa Peters" value={formData.username} onChange={handleChange} />
              </Field>
              <Field label="Email" hint={google ? "From your Google account." : "We'll send password resets here."}>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  readOnly={!!google}
                />
              </Field>
              <DateOfBirth
                value={formData.dateOfBirth}
                onChange={(value) => handleChange({ target: { name: "dateOfBirth", value } })}
              />
              <Field label="House address" optional>
                <input name="houseAddress" autoComplete="street-address" placeholder="e.g. 12 Oxford St, Accra" value={formData.houseAddress} onChange={handleChange} />
              </Field>
            </FormSection>

            {/* PASSWORD (not needed when signing up with Google) */}
            {!google && (
              <FormSection id="password-title" title="Password" text="Choose a password you don't use on other websites.">
                <Field label="Password">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <EyeButton shown={showPassword} onClick={toggleShowPassword} />
                </Field>
                <Field label="Confirm password">
                  <input
                    name="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Type it again"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  <EyeButton shown={showConfirm} onClick={toggleShowConfirm} />
                </Field>
              </FormSection>
            )}

            {/* BUILDING METER */}
            <FormSection
              id="meter-title"
              title="Building meter"
              text="The main meter for the whole building. Each room's own meter number goes in Rooms below."
            >
              <Field label="Meter serial number" optional>
                <input name="meterSerialNumber" placeholder="e.g. 131xxxxxxx" value={formData.meterSerialNumber} onChange={handleChange} />
              </Field>
              <Field label="Meter type" optional>
                <select name="meterType" value={formData.meterType} onChange={handleChange}>
                  <option value="">Choose prepaid or postpaid</option>
                  <option value="prepaid">Prepaid</option>
                  <option value="postpaid">Postpaid</option>
                </select>
              </Field>
            </FormSection>

            {/* ROOMS */}
            <section className="rooms" aria-labelledby="rooms-title">
              <header className="rooms-head">
                <div>
                  <h2 id="rooms-title">Rooms</h2>
                  <p>
                    Add each room you rent out and the email of the tenant living in it. You need at least two rooms.
                    If you know each room's meter number, add it so readings start arriving straight away; you can also add it later on the Analysis page.
                  </p>
                </div>
                <span className="rooms-count">{rooms.length} room{rooms.length === 1 ? "" : "s"}</span>
              </header>

              <ol className="room-list">
                {rooms.map((room, i) => (
                  <li key={i} className="room-card">
                    <div className="room-card-head">
                      <span className="room-number">Room {i + 1}</span>
                      {/* The first two rooms are required, so only extra rooms can be removed */}
                      {i >= 2 && (
                        <button type="button" className="remove" aria-label={`Remove room ${i + 1}`} onClick={() => removeRoom(i)}>
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="room-fields">
                      <Field label="Room name">
                        <input
                          placeholder={`e.g. Room ${String.fromCharCode(65 + (i % 26))}`}
                          value={room.room}
                          onChange={(e) => handleRoomChange(i, "room", e.target.value)}
                        />
                      </Field>
                      <Field label="Tenant email">
                        <input
                          type="email"
                          placeholder="tenant@example.com"
                          value={room.email}
                          onChange={(e) => handleRoomChange(i, "email", e.target.value)}
                        />
                      </Field>
                      <Field label="Meter number (optional)">
                        <input
                          placeholder="e.g. 12345678"
                          maxLength={40}
                          value={room.meter}
                          onChange={(e) => handleRoomChange(i, "meter", e.target.value)}
                        />
                      </Field>
                    </div>
                  </li>
                ))}
              </ol>

              <button type="button" className="add-room" onClick={addRoom}>
                <span aria-hidden="true">+</span> Add another room
              </button>
            </section>

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
                <GoogleButton role="landlord" text="signup_with" onMessage={showError} />
              </>
            )}
          </form>
        </div>
      </section>
    </div>
  );
}