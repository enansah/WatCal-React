import { useAccountLogin } from "./Useaccountlogin";

export const useLoginLogic = () =>
  useAccountLogin({
    role: "landlord",
    endpoint: "/api/landlordLogin",
    dashboard: "/Landlord/Dashboard",
    forgotPassword: "/Landlord/forgot-password",
    authCheck: "/api/landlordIsAuthenticated",
  });