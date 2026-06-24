import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { applyAccent } from "./config/theme";
import "./index.css";

// Apply the chosen accent color before first paint (see src/config/theme.ts).
applyAccent();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
