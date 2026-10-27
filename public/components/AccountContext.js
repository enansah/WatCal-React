import { createContext, useContext } from "react";

// Provided by AccountLayout (landlords and private users). Pages call useAccount() to get the logged-in
// account; the value also has the account under its role name, e.g. { landlord } or { tenant }.
export const AccountContext = createContext({
  account: null,
  role: null,
  logout: () => {},
  updateAccount: () => {},
});
export const useAccount = () => useContext(AccountContext);
