import { Routes, Route } from "react-router-dom";
import Layout from "../public/pages/Layout.jsx";
import Home from "../public/pages/Home.jsx";
import About from "../public/pages/About.jsx";
import Helpdesk from "../public/pages/Helpdesk.jsx";
import Contact from "../public/pages/Contactus.jsx";
import Login from "../public/pages/LLogin.jsx";
import TLogin from "../public/pages/TLogin.jsx";
import Security from "../public/pages/Security.jsx";
import Privacy from "../public/pages/Privacy.jsx";
import Terms from "../public/pages/Terms.jsx";
import TSignup from "../public/pages/TSignup.jsx";
import LSignup from "../public/pages/LSignup.jsx";
import ForgotPassword from "../public/pages/Lforgotpassword.jsx";
import ForgotPasswordTenant from "../public/pages/Tforgotpassword.jsx";
import ResetPasswordTenant  from "../public/pages/Tsetpassword.jsx";
import ResetPasswordLandlord from "../public/pages/Lsetpassword.jsx";
import RedirectLogin from "../public/pages/TDashboardLogin.jsx";
import Redirect from "../public/pages/TDashboard.jsx";

 {/*Landlord*/}
import LandlordLayout from "../public/Landlord/Layout";
import LandlordDashboard from "../public/Landlord/Dashboard.jsx";
import LandlordAnalysis from "../public/Landlord/Analysis.jsx";
import LandlordHistory from "../public/Landlord/History.jsx";
import LandlordSettings from "../public/Landlord/Settings.jsx";
import LandlordEditProfile from "../public/Landlord/EditProfile";
import LandlordPayment from "../public/Landlord/Payment.jsx";

{/*Private user (tenant)*/}
import TenantLayout from "../public/Tenant/Layout.jsx";
import PrivateDashboard from "../public/Tenant/PrivateDashboard.jsx";
import PrivateHistory from "../public/Tenant/PrivateHistory.jsx";
import { PRIVATE_USER_PROFILE } from "../public/Landlord/Logic/Editprofile.js";
import { PRIVATE_USER_PAYMENT } from "../public/Landlord/Logic/Payment.js";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/About" element={<About />} />
        <Route path="/Helpdesk" element={<Helpdesk />} />
        <Route path="/Contactus" element={<Contact />} />
        <Route path="/LLogin" element={<Login />} />
        <Route path="/TLogin" element={<TLogin />} />
        <Route path="/Security" element={<Security />} />
        <Route path="/Privacy" element={<Privacy />} />
        <Route path="/Terms" element={<Terms />} />
        <Route path="/TSignup" element={<TSignup />} />
        <Route path="/LSignup" element={<LSignup />} />
        <Route path="/Landlord/forgot-password" element={<ForgotPassword />} />
        <Route path="/tenant/forgot-password" element={<ForgotPasswordTenant />} />
        <Route path="/landlord/reset-password" element={<ResetPasswordLandlord />} />
        <Route path="/tenant/reset-password" element={<ResetPasswordTenant />} />
        <Route path="/RedirectLogin" element={<RedirectLogin />} />
        <Route path="/Redirect" element={<Redirect />} />

      </Route>
      
      {/*Landlord*/}
      <Route element={<LandlordLayout />}>
        <Route path="/Landlord/Dashboard" element={<LandlordDashboard />} />
        <Route path="/Landlord/Analysis" element={<LandlordAnalysis />} />
        <Route path="/Landlord/History" element={<LandlordHistory />} />
        <Route path="/Landlord/Settings" element={<LandlordSettings />} />
        <Route path="/Landlord/EditProfile" element={<LandlordEditProfile />} />
        <Route path="/Landlord/Payment" element={<LandlordPayment />} />
 
      </Route>    

      {/*Private user (tenant)*/}
      <Route element={<TenantLayout />}>
        <Route path="/tenant/dashboard" element={<PrivateDashboard />} />
        <Route path="/tenant/history" element={<PrivateHistory />} />
        <Route path="/tenant/settings" element={<LandlordSettings editProfilePath="/tenant/editprofile" />} />
        <Route path="/tenant/editprofile" element={<LandlordEditProfile config={PRIVATE_USER_PROFILE} />} />
        <Route path="/tenant/payment" element={<LandlordPayment config={PRIVATE_USER_PAYMENT} />} />
      </Route>
    </Routes>
  );
}



