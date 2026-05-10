import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import App from "./App.jsx";
import Admin from "./pages/Admin.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import AppErrorBoundary from "./components/AppErrorBoundary.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import "./styles.css";

window.addEventListener("error", (event) => {
  const root = document.getElementById("root");
  if (root && root.childElementCount === 0) {
    root.innerHTML = `<main style="min-height:100vh;background:#FAF9F6;color:#2C2A29;padding:48px;font-family:Georgia,serif"><h1>Nomade Project</h1><pre>${event.message}</pre></main>`;
  }
});

window.addEventListener("unhandledrejection", (event) => {
  const root = document.getElementById("root");
  if (root && root.childElementCount === 0) {
    root.innerHTML = `<main style="min-height:100vh;background:#FAF9F6;color:#2C2A29;padding:48px;font-family:Georgia,serif"><h1>Nomade Project</h1><pre>${String(event.reason?.message ?? event.reason)}</pre></main>`;
  }
});

try {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <AppErrorBoundary>
        <BrowserRouter>
          <CartProvider>
            <Routes>
              <Route path="/" element={<App />} />
              <Route path="/contacto" element={<Contact />} />
              <Route path="/acerca" element={<About />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </CartProvider>
        </BrowserRouter>
      </AppErrorBoundary>
    </React.StrictMode>
  );
} catch (error) {
  document.getElementById("root").innerHTML = `
    <main style="min-height:100vh;background:#FAF9F6;color:#2C2A29;padding:48px;font-family:Georgia,serif">
      <h1 style="font-size:36px;font-weight:400">Nomade Project</h1>
      <p style="max-width:640px;line-height:1.7">La aplicacion no pudo iniciar en este navegador. Revisa la consola para ver el detalle tecnico.</p>
      <pre style="white-space:pre-wrap;border:1px solid #E5E2DE;padding:16px;background:transparent">${String(
        error?.message ?? error
      )}</pre>
    </main>
  `;
}
