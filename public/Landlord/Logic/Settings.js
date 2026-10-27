import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "../../components/AccountContext.js";

// Each item: [label, icon, action]. An action is a route, "logout", "addAccount", or null (not built yet).
const makeGroups = (editProfilePath) => [
  {
    title: "Account",
    icon: "accusoft.svg",
    items: [
      ["Edit profile", "user.svg", editProfilePath],
      ["Privacy", "padlock.svg", "/Privacy"],
    ],
  },
  {
    title: "Support & About",
    icon: "phabricator.svg",
    items: [
      ["Help & Support", "q.svg", "/Helpdesk"],
      ["Terms and Policies", "terms.svg", "/Terms"],
    ],
  },
  {
    title: "Actions",
    icon: "compact-disc.svg",
    items: [
      ["Report a problem", "flag.svg", "/Contactus"],
      ["Add account", "adduser.svg", "addAccount"],
      ["Log out", "logout.svg", "logout"],
    ],
  },
];

export const ADD_ACCOUNT = [
  ["/TSignup", "As a Private User"],
  ["/LSignup", "As a Landlord"],
];

// Shared by landlords and private users; each passes its own Edit profile page
export default function useAccountSettings({ editProfilePath = "/Landlord/EditProfile" } = {}) {
  const navigate = useNavigate();
  const { account, logout } = useAccount();
  const [addAccount, setAddAccount] = useState(false);

  const run = (action) => {
    if (!action) return;
    if (action === "logout") logout();
    else if (action === "addAccount") setAddAccount(true);
    else navigate(action);
  };

  return {
    groups: makeGroups(editProfilePath),
    username: account?.username,
    email: account?.email,
    landlordId: account?.uniqueId, // landlords only
    avatar: account?.avatar,
    run,
    addAccount,
    closeAddAccount: () => setAddAccount(false),
    goTo: (path) => {
      setAddAccount(false);
      navigate(path);
    },
  };
}
