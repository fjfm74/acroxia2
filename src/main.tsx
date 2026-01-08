import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker } from "./utils/registerServiceWorker";

// Register Service Worker for caching
registerServiceWorker();

createRoot(document.getElementById("root")!).render(<App />);
