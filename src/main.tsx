import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

registerSW({
  immediate: true,
  onNeedRefresh() {
    window.location.reload();
  },
  onOfflineReady() {
    window.dispatchEvent(new Event("lovable-pwa-ready"));
  },
});

createRoot(document.getElementById("root")!).render(<App />);
