import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { App } from "@/components/0-all/0-app";
import "./index.css";

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
