import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

// Force unregister service workers in preview/iframe contexts
const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();
const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

if (isPreviewHost || isInIframe) {
  navigator.serviceWorker?.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
} else {
  // Register SW with auto-update — force reload on new version
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      // New version available — update and reload instantly
      updateSW(true);
    },
    onOfflineReady() {
      window.dispatchEvent(new Event("lovable-pwa-ready"));
    },
    onRegisteredSW(_url, registration) {
      // Check for updates every 60 seconds
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 60 * 1000);
      }
    },
  });
}

createRoot(document.getElementById("root")!).render(<App />);
