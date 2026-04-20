import { createRoot } from "react-dom/client";
// Explicit import to guarantee react-helmet-async stays in the production bundle
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker } from "./utils/registerServiceWorker";

// Keep reference alive so tree-shaking cannot drop the module
if (typeof window !== "undefined") {
  (window as unknown as { __helmetProvider?: unknown }).__helmetProvider = HelmetProvider;
}

// Register Service Worker for caching
registerServiceWorker();

createRoot(document.getElementById("root")!).render(<App />);
