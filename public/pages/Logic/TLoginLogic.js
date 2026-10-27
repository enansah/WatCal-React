import { useAccountLogin } from "./Useaccountlogin";

export const useTLoginLogic = () =>
  useAccountLogin({
    role: "tenant",
    endpoint: "/api/tenantLogin",
    dashboard: "/tenant/dashboard",
    forgotPassword: "/tenant/forgot-password",
    authCheck: "/api/tenantIsAuthenticated",
  });