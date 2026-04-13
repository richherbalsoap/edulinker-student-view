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
  // Force clear old caches on load for mobile freshness
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        if (name.includes('workbox') || name.includes('assets-cache') || name.includes('html-cache')) {
          caches.delete(name);
        }
      });
    });
  }

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      // Turant reload — no toast delay on mobile
      updateSW(true);
    },
    onOfflineReady() {
      console.log('[PWA] Offline ready');
    },
    onRegisteredSW(_url, registration) {
      if (registration) {
        // Check for updates every 30 seconds (faster for mobile)
        setInterval(() => registration.update(), 30 * 1000);
        // Also force check on visibility change (when user switches back to app)
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            registration.update();
          }
        });
      }
    },
  });
}

createRoot(document.getElementById("root")!).render(<App />);
