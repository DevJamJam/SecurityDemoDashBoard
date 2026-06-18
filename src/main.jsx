import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/variables.css";
import "./styles/base.css";
import App from "./App";

async function enableMocking() {
  const { worker } = await import("./mocks/browser");
  return worker.start({
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
    onUnhandledRequest: "bypass",
  });
}

enableMocking().then(() => {
  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
