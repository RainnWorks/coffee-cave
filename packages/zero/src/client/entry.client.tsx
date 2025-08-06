import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { HydratedRouter } from "react-router/dom";
import { AuthedZeroProvider } from "./AuthedZeroProvider.tsx";


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HydratedRouter />
  </StrictMode>
);
