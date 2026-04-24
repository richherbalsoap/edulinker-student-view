import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

declare global {
  interface Window {
    __EDULINKER_PWA_RELOADING__?: boolean;
  }
}

const UPDATE_CHECK_INTERVAL = 5 * 1000;

const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();
const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

const clearRuntimeCaches = async () => {
  if (!("caches" in window)) return;

  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames
      .filter((name) => RUNTIME_CACHES.some((cacheKey) => name.includes(cacheKey)))
      .map((name) => caches.delete(name)),
  );
};

const getCurrentBundleUrl = () =>
  document.querySelector<HTMLScriptElement>('script[type="module"][src*="/assets/"]')?.src ?? null;

const getBundleUrlFromHtml = (html: string) => {
  const documentFromHtml = new DOMParser().parseFromString(html, "text/html");
  const bundlePath = documentFromHtml
    .querySelector<HTMLScriptElement>('script[type="module"][src*="/assets/"]')
    ?.getAttribute("src");

  return bundlePath ? new URL(bundlePath, window.location.origin).href : null;
};

const reloadToLatestBuild = async () => {
  if (window.__EDULINKER_PWA_RELOADING__) return;

  window.__EDULINKER_PWA_RELOADING__ = true;
  await clearRuntimeCaches().catch(() => undefined);
  window.location.reload();
};

if (isPreviewHost || isInIframe) {
  navigator.serviceWorker?.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
} else {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      updateSW(true);
    },
    onOfflineReady() {
      console.log('[PWA] Offline ready');
    },
    onRegisteredSW(_url, registration) {
      if (registration) {
        const checkForLatestBuild = async () => {
          if (document.visibilityState === "hidden") return;

          await registration.update().catch(() => undefined);

          try {
            const response = await fetch("/", {
              cache: "no-store",
              headers: {
                "cache-control": "no-cache",
                pragma: "no-cache",
              },
            });

            if (!response.ok) return;

            const nextBundleUrl = getBundleUrlFromHtml(await response.text());
            const currentBundleUrl = getCurrentBundleUrl();

            if (currentBundleUrl && nextBundleUrl && currentBundleUrl !== nextBundleUrl) {
              await reloadToLatestBuild();
            }
          } catch {
            // Ignore network failures; regular SW polling will retry.
          }
        };

        void checkForLatestBuild();
        window.setInterval(() => {
          void checkForLatestBuild();
        }, UPDATE_CHECK_INTERVAL);

        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            void checkForLatestBuild();
          }
        });

        window.addEventListener("focus", () => {
          void checkForLatestBuild();
        });

        window.addEventListener("pageshow", (event) => {
          if (event.persisted || document.visibilityState === "visible") {
            void checkForLatestBuild();
          }
        });

        navigator.serviceWorker?.addEventListener("controllerchange", () => {
          void reloadToLatestBuild();
        });
      }
    },
  });
}

createRoot(document.getElementById("root")!).render(<App />);
