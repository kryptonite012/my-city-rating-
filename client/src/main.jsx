import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import RateMyCity from "./RateMyCity";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RateMyCity />
  </StrictMode>
);
