import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import PageBehaviour from "../public/components/PageBehaviour.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <PageBehaviour />
    <App />
  </BrowserRouter>
);