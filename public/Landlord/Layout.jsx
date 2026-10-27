import React from "react";
import AccountLayout, { DEFAULT_AVATAR } from "../components/AccountLayout.jsx";

export { DEFAULT_AVATAR };

const LANDLORD = {
  role: "landlord",
  label: "Landlord",
  authPath: "/api/landlordIsAuthenticated",
  logoutPath: "/api/landlordLogout",
  loginPath: "/LLogin",
  home: "/Landlord/Dashboard",
  profilePath: "/Landlord/EditProfile",
  menu: [
    ["/Landlord/Dashboard", "Dashboard", "home.svg"],
    ["/Landlord/Analysis", "Analysis", "stat.svg"],
    ["/Landlord/History", "History", "clk.svg"],
    ["/Landlord/Settings", "Settings", "tools.svg"],
  ],
  titles: {
    "/landlord/dashboard": "Dashboard",
    "/landlord/analysis": "Analysis",
    "/landlord/settings": "Settings",
    "/landlord/history": "History",
    "/landlord/editprofile": "Edit Profile",
    "/landlord/payment": "Payment",
  },
};

export default function LandlordLayout({ children }) {
  return <AccountLayout config={LANDLORD}>{children}</AccountLayout>;
}
