import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import RateMyCity from "./RateMyCity.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RateMyCity />
  </StrictMode>
);
