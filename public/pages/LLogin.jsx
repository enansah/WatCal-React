import React from "react";
import LoginForm from "./Loginform";
import { useLoginLogic } from "./Logic/LLoginLogic";

function LLogin() {
  const logic = useLoginLogic();
  return <LoginForm logic={logic} />;
}

export default LLogin;