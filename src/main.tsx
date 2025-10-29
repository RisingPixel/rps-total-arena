import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Prevent page jump on arrow keys and space
window.addEventListener('keydown', (ev) => {
  if (['ArrowDown', 'ArrowUp', ' '].includes(ev.key)) {
    ev.preventDefault();
  }
});

window.addEventListener('wheel', (ev) => ev.preventDefault(), { passive: false });

createRoot(document.getElementById("root")!).render(<App />);
