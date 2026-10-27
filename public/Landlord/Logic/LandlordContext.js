import { useContext } from "react";
import { AccountContext } from "../../components/AccountContext.js";

// Landlord pages call useLandlord() to get { landlord, logout, updateLandlord } from the shared account layout.
export const LandlordContext = AccountContext;
export const useLandlord = () => useContext(AccountContext);
