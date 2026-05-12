import { demoBranding, demoCategorias, demoLogo, demoProductos } from "./demoData.js";

const LOGO_KEY = "nomade-demo-logo";
const BRANDING_KEY = "nomade-demo-branding";
const CATEGORIES_KEY = "nomade-demo-categories";
const PRODUCTS_KEY = "nomade-demo-products";
const ORDERS_KEY = "nomade-demo-orders";

export function readDemoLogo() {
  try {
    return window.localStorage.getItem(LOGO_KEY) || demoLogo;
  } catch {
    return demoLogo;
  }
}

export function writeDemoLogo(value) {
  try {
    window.localStorage.setItem(LOGO_KEY, value);
    window.dispatchEvent(new CustomEvent("nomade-logo-updated", { detail: value }));
  } catch {
    // Demo storage may be blocked in some embedded browsers.
  }
}

export function readDemoBranding() {
  try {
    return { ...demoBranding, ...(JSON.parse(window.localStorage.getItem(BRANDING_KEY)) ?? {}) };
  } catch {
    return demoBranding;
  }
}

export function writeDemoBranding(value) {
  try {
    window.localStorage.setItem(BRANDING_KEY, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("nomade-branding-updated", { detail: value }));
  } catch {
    // Demo storage may be blocked in some embedded browsers.
  }
}

export function readDemoCategories() {
  try {
    return JSON.parse(window.localStorage.getItem(CATEGORIES_KEY)) ?? demoCategorias;
  } catch {
    return demoCategorias;
  }
}

export function writeDemoCategories(categories) {
  try {
    window.localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
    window.dispatchEvent(new CustomEvent("nomade-categories-updated", { detail: categories }));
  } catch {
    // Non-critical in demo mode.
  }
}

export function readDemoProducts() {
  try {
    return JSON.parse(window.localStorage.getItem(PRODUCTS_KEY)) ?? demoProductos;
  } catch {
    return demoProductos;
  }
}

export function writeDemoProducts(products) {
  try {
    window.localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  } catch {
    // Non-critical in demo mode.
  }
}

export function appendDemoOrder(order) {
  try {
    const current = JSON.parse(window.localStorage.getItem(ORDERS_KEY)) ?? [];
    window.localStorage.setItem(ORDERS_KEY, JSON.stringify([order, ...current]));
  } catch {
    // Non-critical in demo mode.
  }
}

export function writeDemoOrders(orders) {
  try {
    window.localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch {
    // Non-critical in demo mode.
  }
}

export function readDemoOrders() {
  try {
    return JSON.parse(window.localStorage.getItem(ORDERS_KEY)) ?? [];
  } catch {
    return [];
  }
}

export function readDemoPaidRevenue() {
  try {
    const orders = readDemoOrders();
    return orders
      .filter((order) => order.status_pago === "pagado")
      .reduce((sum, order) => sum + Number(order.total ?? 0), 0);
  } catch {
    return 12480;
  }
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
