import React from "react";
import "../css/Signup-index.css";
import useLSignupLogic from "./Logic/LSignupLogic";
import { useLayout } from "./Logic/LayoutContext.js";
import GoogleButton from "../components/GoogleButton.jsx";

const Field = ({ label, children }) => (
  <label className="field">
    <b>{label}</b>
    <div className="control">{children}</div>
  </label>
);

export default function LSignup() {
  const {
    formData,
    handleChange,
    handleSubmit,
    rooms,
    addRoom,
    removeRoom,
    handleRoomChange,
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

            <div className="fields">
              <Field label="Username">
                <input name="username" placeholder="Melissa Peters" value={formData.username} onChange={handleChange} />
              </Field>

              <Field label="Email">
                <input name="email" type="email" placeholder="melpeters@gmail.com" value={formData.email} onChange={handleChange} readOnly={!!google} />
              </Field>

              {!google && (<>
              <Field label="Enter password">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="*********"
                  value={formData.password}
                  onChange={handleChange}
                />
                <img
                  className="eye"
                  alt={showPassword ? "Hide password" : "Show password"}
                  src={showPassword ? "/images/closed-eyel.png" : "/images/eye.svg"}
                  onClick={toggleShowPassword}
                />
              </Field>

              <Field label="Confirm password">
                <input
                  name="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="*********"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <img
                  className="eye"
                  alt={showConfirm ? "Hide password" : "Show password"}
                  src={showConfirm ? "/images/closed-eyel.png" : "/images/eye.svg"}
                  onClick={toggleShowConfirm}
                />
              </Field>
              </>)}

              <Field label="Date of Birth">
                <input name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} />
              </Field>

              <Field label="Meter serial number">
                <input name="meterSerialNumber" placeholder="131xxxxxxx" value={formData.meterSerialNumber} onChange={handleChange} />
              </Field>

              <Field label="House address">
                <input name="houseAddress" placeholder="(Optional)" value={formData.houseAddress} onChange={handleChange} />
              </Field>

              <Field label="Meter type">
                <select name="meterType" value={formData.meterType} onChange={handleChange}>
                  <option value="">Select meter-type</option>
                  <option value="prepaid">Prepaid</option>
                  <option value="postpaid">Postpaid</option>
                </select>
              </Field>
            </div>

            {/* ROOMS */}
            <div className="rooms">
              <div className="rooms-head">
                <h2>Rooms</h2>
                <p>Add at least two rooms, with the email of the tenant in each.</p>
              </div>

              {rooms.map((room, i) => (
                <div key={i} className="room-row">
                  <Field label={`Room ${i + 1}`}>
                    <input
                      placeholder="e.g. Room A"
                      value={room.room}
                      onChange={(e) => handleRoomChange(i, "room", e.target.value)}
                    />
                  </Field>
                  <Field label="Email">
                    <input
                      type="email"
                      placeholder="tenant@example.com"
                      value={room.email}
                      onChange={(e) => handleRoomChange(i, "email", e.target.value)}
                    />
                  </Field>
                  {i >= 2 ? (
                    <button type="button" className="remove" aria-label={`Remove room ${i + 1}`} onClick={() => removeRoom(i)}>✕</button>
                  ) : (
                    <span className="remove-spacer" />
                  )}
                </div>
              ))}

              <button type="button" className="add-room" onClick={addRoom}>+ Add room</button>
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
                <GoogleButton role="landlord" text="signup_with" onMessage={showError} />
              </>
            )}
          </form>
        </div>
      </section>
    </div>
  );
}