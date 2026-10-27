import React from "react";
import AccountLayout from "../components/AccountLayout.jsx";

// Layout for private users (tenants with their own meter)
const PRIVATE_USER = {
  role: "tenant",
  label: "Private user",
  authPath: "/api/tenantIsAuthenticated",
  logoutPath: "/api/tenantLogout",
  loginPath: "/TLogin",
  home: "/tenant/dashboard",
  profilePath: "/tenant/editprofile",
  menu: [
    ["/tenant/dashboard", "Dashboard", "home.svg"],
    ["/tenant/history", "History", "clk.svg"],
    ["/tenant/settings", "Settings", "tools.svg"],
  ],
  titles: {
    "/tenant/dashboard": "Dashboard",
    "/tenant/history": "History",
    "/tenant/settings": "Settings",
    "/tenant/editprofile": "Edit Profile",
    "/tenant/payment": "Payment",
  },
};

export default function TenantLayout({ children }) {
  return <AccountLayout config={PRIVATE_USER}>{children}</AccountLayout>;
}
