import React from "react";
import "./css/Editprofile.css";
import useAccountEditProfile, { LANDLORD_PROFILE } from "./Logic/Editprofile.js";
import { DEFAULT_AVATAR } from "./Layout.jsx";

function Field({ id, label, hint, error, children }) {
  return (
    <div className={`field ${error ? "invalid" : ""}`}>
      <label htmlFor={id}>
        {label}
        {hint && <small>{hint}</small>}
      </label>
      {children}
      {error && <p className="field-error" id={`${id}-error`}>{error}</p>}
    </div>
  );
}

// Used for landlords and, with config={PRIVATE_USER_PROFILE}, for private users (no Rooms section)
export default function AccountEditProfile({ config = LANDLORD_PROFILE }) {
  const {
    status, form, rooms, newRooms, errors, message, saving, photoBusy, dirty, fileRef, avatar, username, withRooms,
    reload, setField, addRoom, removeRoom, setRoom, save, discard, choosePhoto, pickPhoto, removePhoto, goBack,
  } = useAccountEditProfile(config);

  const input = (id, props = {}) => ({
    id,
    value: form[id],
    onChange: setField(id),
    "aria-invalid": !!errors[id],
    "aria-describedby": errors[id] ? `${id}-error` : undefined,
    ...props,
  });

  return (
    <div className="lprofile">
      <div className="wrap">
        {/* HEADLINE */}
        <div className="headline">
          <button className="back" onClick={goBack} aria-label="Go back">
            <img alt="" src="/Landlord/images/back.svg" />
          </button>
          <div>
            <p className="eyebrow">Account</p>
            <h1>Edit profile</h1>
          </div>
        </div>

        {status === "loading" && <p className="state">Loading your profile...</p>}

        {status === "error" && (
          <div className="state">
            <p>We could not load your profile.</p>
            <button className="btn small" onClick={reload}>Try again</button>
          </div>
        )}

        {status === "ok" && (
          <div className="grid">
            {/* PHOTO */}
            <aside className="card photo" aria-label="Profile photo">
              <button className="avatar-btn" onClick={choosePhoto} disabled={photoBusy} aria-label="Change profile photo">
                <img alt="" src={avatar || DEFAULT_AVATAR} />
                <span className="avatar-overlay" aria-hidden="true">{photoBusy ? "Saving..." : "Change"}</span>
              </button>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={pickPhoto} />
              <div className="who">
                <b>{username}</b>
                <small>{form.email}</small>
              </div>
              <div className="photo-actions">
                <button className="btn small" onClick={choosePhoto} disabled={photoBusy}>
                  {avatar ? "Change photo" : "Upload photo"}
                </button>
                {avatar && (
                  <button className="link-btn" onClick={removePhoto} disabled={photoBusy}>Remove</button>
                )}
              </div>
              <p className="hint">JPG, PNG or WebP. Your photo is cropped to a square.</p>
            </aside>

            {/* DETAILS */}
            <form className="card details" onSubmit={save} noValidate>
              <section>
                <h2>Personal details</h2>
                <div className="fields">
                  <Field id="username" label="Username" error={errors.username}>
                    <input {...input("username", { autoComplete: "username", placeholder: "Melissa Peters" })} />
                  </Field>
                  <Field id="email" label="Email" error={errors.email}>
                    <input {...input("email", { type: "email", autoComplete: "email", placeholder: "melpeters@gmail.com" })} />
                  </Field>
                  <Field id="dateOfBirth" label="Date of birth" error={errors.dateOfBirth}>
                    <input {...input("dateOfBirth", { type: "date", autoComplete: "bday" })} />
                  </Field>
                  <Field id="meterSerialNumber" label="Meter serial number">
                    <input {...input("meterSerialNumber", { placeholder: "131xxxxxxx", inputMode: "numeric" })} />
                  </Field>
                  <Field id="houseAddress" label="House address" hint="Optional">
                    <input {...input("houseAddress", { autoComplete: "street-address", placeholder: "House number, street, town" })} />
                  </Field>
                  <Field id="meterType" label="Meter type">
                    <select {...input("meterType")}>
                      <option value="" disabled>Select meter type</option>
                      <option value="prepaid">Prepaid</option>
                      <option value="postpaid">Postpaid</option>
                    </select>
                  </Field>
                </div>
              </section>

              {withRooms && (
              <section>
                <div className="section-head">
                  <h2>Rooms</h2>
                  <button type="button" className="add-room" onClick={addRoom}>
                    <img alt="" src="/Landlord/images/broom.svg" />
                    Add room
                  </button>
                </div>

                {rooms.length === 0 && newRooms.length === 0 ? (
                  <p className="muted">No rooms yet.</p>
                ) : (
                  <ul className="rooms">
                    {rooms.map((r) => (
                      <li key={r._id} className="room">
                        <b>{r.roomNumber}</b>
                        <span>{r.roomEmail}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {newRooms.map((r, i) => (
                  <div key={r.key} className={`new-room ${errors[`room-${r.key}`] ? "invalid" : ""}`}>
                    <div className="new-room-fields">
                      <Field id={`room-${r.key}`} label={`New room ${i + 1}`}>
                        <input id={`room-${r.key}`} value={r.room} onChange={setRoom(r.key, "room")} placeholder="e.g. Room C" />
                      </Field>
                      <Field id={`room-email-${r.key}`} label="Tenant email">
                        <input id={`room-email-${r.key}`} type="email" value={r.email} onChange={setRoom(r.key, "email")} placeholder="tenant@example.com" />
                      </Field>
                      <Field id={`room-meter-${r.key}`} label="Meter number (optional)">
                        <input id={`room-meter-${r.key}`} value={r.meter} onChange={setRoom(r.key, "meter")} placeholder="e.g. 12345678" maxLength={40} />
                      </Field>
                    </div>
                    <button type="button" className="remove-room" onClick={() => removeRoom(r.key)} aria-label={`Remove new room ${i + 1}`}>✕</button>
                    {errors[`room-${r.key}`] && <p className="field-error">{errors[`room-${r.key}`]}</p>}
                  </div>
                ))}
              </section>
              )}

              <div className="form-foot">
                {message && (
                  <p className={`message ${message.type}`} role={message.type === "error" ? "alert" : "status"}>{message.text}</p>
                )}
                <div className="buttons">
                  {dirty && <button type="button" className="discard" onClick={discard} disabled={saving}>Discard</button>}
                  <button type="submit" className="save" disabled={saving || !dirty}>
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
