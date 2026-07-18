import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Cleanup: unregister any previously installed service workers and clear caches
// so old auto-reload behavior doesn't interfere.
const cleanupServiceWorkers = async () => {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister().catch(() => undefined)));
    }
    if (typeof window !== "undefined" && "caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    // ignore
  }
};

const mountApp = () => {
  createRoot(document.getElementById("root")!).render(<App />);
};

mountApp();
cleanupServiceWorkers();
