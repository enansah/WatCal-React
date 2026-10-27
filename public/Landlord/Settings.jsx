import React from "react";
import "./css/Settings-index.css";
import useAccountSettings, { ADD_ACCOUNT } from "./Logic/Settings.js";
import Popup from "../components/Popup.jsx";
import { DEFAULT_AVATAR } from "./Layout.jsx";

// Used for landlords and, with editProfilePath="/tenant/editprofile", for private users
export default function AccountSettings({ editProfilePath = "/Landlord/EditProfile" }) {
  const { groups, username, email, landlordId, avatar, run, addAccount, closeAddAccount, goTo } = useAccountSettings({ editProfilePath });

  return (
    <div className="lsettings">
      <div className="wrap">
        {/* HEADLINE */}
        <div className="headline">
          <div>
            <p className="eyebrow">Settings</p>
            <h1>Manage your account</h1>
          </div>
          <div className="who">
            <img alt="" src={avatar || DEFAULT_AVATAR} />
            <span>
              <b>{username}</b>
              <small>{email}</small>
            </span>
            {landlordId && <em>ID {landlordId}</em>}
          </div>
        </div>

        {/* GROUPS */}
        <div className="groups">
          {groups.map((group) => (
            <section key={group.title} className="setting-group" aria-label={group.title}>
              <div className="badge" aria-hidden="true">
                <span><img alt="" src={`/Landlord/images/${group.icon}`} /></span>
              </div>
              <h2>{group.title}</h2>

              <ul className="items">
                {group.items.map(([label, icon, action]) => (
                  <li key={label}>
                    <button
                      className={`item ${action === "logout" ? "danger" : ""}`}
                      disabled={!action}
                      onClick={() => run(action)}
                    >
                      <img alt="" src={`/Landlord/images/${icon}`} />
                      <span>{label}</span>
                      {action ? <i aria-hidden="true">›</i> : <small className="soon">Coming soon</small>}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>

      {/* ADD ACCOUNT */}
      {addAccount && (
        <Popup label="Add account" onClose={closeAddAccount} showClose={false} className="modal outline">
          {ADD_ACCOUNT.map(([path, label]) => (
            <button key={path} className="option" onClick={() => goTo(path)}>{label}</button>
          ))}
        </Popup>
      )}
    </div>
  );
}
