import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function useHomeLogic() {
  const [isSurfaceOpen, setIsSurfaceOpen] = useState(false);
  const [isSignupPopupOpen, setIsSignupPopupOpen] = useState(false); // SINGLE STATE
  const navigate = useNavigate();

  // LOGIN POPUP
  const popsurface = () => setIsSurfaceOpen(true);
  const hideSurface = () => setIsSurfaceOpen(false);

  // SIGNUP POPUP (ONE FUNCTION FOR ALL BUTTONS)
  const openSignupPopup = () => setIsSignupPopupOpen(true);
  const closeSignupPopup = () => setIsSignupPopupOpen(false);

  // NAVIGATION
  const goTo = (path) => navigate(path);

  // BUTTON LOGIC (Simulated loading like original)
  const handleLoadingNavigation = (path) => {
    setTimeout(() => {
      navigate(path);
    }, 2000);
  };

  return {
    isSurfaceOpen,
    popsurface,
    hideSurface,
    isSignupPopupOpen,
    openSignupPopup,
    closeSignupPopup,
    goTo,
    handleLoadingNavigation,
  };
}

  
