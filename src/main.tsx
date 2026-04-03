import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

// Lovable preview/iframe mein SW disable karo
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
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      const event = new CustomEvent("pwa-update-available", { detail: { updateSW } });
      window.dispatchEvent(event);
    },
    onOfflineReady() {
      window.dispatchEvent(new Event("pwa-offline-ready"));
    },
    onRegisteredSW(_url, registration) {
      if (registration) {
        setInterval(() => registration.update(), 60 * 1000);
      }
    },
  });
}

createRoot(document.getElementById("root")!).render(<App />);
