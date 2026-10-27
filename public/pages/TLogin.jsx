import React from "react";
import LoginForm from "./Loginform";
import { useTLoginLogic } from "./Logic/TLoginLogic";

function TLogin() {
  const logic = useTLoginLogic();
  return <LoginForm logic={logic} />;
}

export default TLogin;