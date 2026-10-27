import { createContext, useContext } from "react";

// Layout provides these; pages call useLayout(), e.g. const { openSignup } = useLayout();
export const LayoutContext = createContext({ openSignup: () => {}, openLogin: () => {} });
export const useLayout = () => useContext(LayoutContext);