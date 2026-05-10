import React from "react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FileText, ImageUp, Save, TrendingUp, Upload } from "lucide-react";
import QuietLoader from "../components/QuietLoader.jsx";
import { loadBranding, saveBranding } from "../lib/branding.js";
import {
  fileToDataUrl,
  readDemoCategories,
  readDemoLogo,
  readDemoOrders,
  readDemoProducts,
  writeDemoCategories,
  writeDemoLogo,
  writeDemoProducts
} from "../lib/demoStore.js";
import { hasSupabaseConfig, supabase } from "../lib/supabase.js";
import { formatCurrency, firstImage } from "../utils/format.js";

const emptyForm = {
  nombre: "",
  descripcion: "",
  precio_original: "",
  precio_oferta: "",
  stock_quantity: "",
  categoria_id: ""
};

const emptyBranding = {
  contact_heading: "",
  contact_whatsapp: "",
  contact_mail: "",
  social_heading: "",
  social_instagram: "",
  social_facebook: "",
  about_title: "",
  about_content: "",
  about_image: ""
};

export default function Admin() {
  const [categorias, setCategorias] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [productos, setProductos] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [brandingForm, setBrandingForm] = useState(emptyBranding);
  const [logoUrl, setLogoUrl] = useState("");
  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  const selectedProduct = useMemo(
    () => productos.find((product) => product.id === selectedId),
    [productos, selectedId]
  );

  useEffect(() => {
    async function loadAdmin() {
      setLoading(true);
      if (!hasSupabaseConfig) {
        const demoProductos = readDemoProducts();
        const branding = await loadBranding();
        setCategorias(readDemoCategories());
        setProductos(demoProductos);
        setSelectedId(demoProductos[0]?.id ?? "");
        setSalesOrders(readDemoOrders().filter((order) => order.status_pago === "pagado"));
        setLogoUrl(readDemoLogo());
        setBrandingForm(branding);
        setLoading(false);
        return;
      }

      const [
        { data: categoryData },
        { data: productData },
        { data: orderData },
        { data: logoData },
        branding
      ] =
        await Promise.all([
          supabase.from("categorias").select("*").order("nombre"),
          supabase.from("productos").select("*").order("nombre"),
          supabase
            .from("pedidos")
            .select(
              "total, subtotal, shipping_cost, delivery_method, payment_method, status_pago, items, created_at"
            )
            .eq("status_pago", "pagado"),
          supabase.from("configuracion_sitio").select("valor").eq("clave", "logo_url").single(),
          loadBranding()
        ]);

      setCategorias(categoryData ?? []);
      setProductos(productData ?? []);
      setSelectedId(productData?.[0]?.id ?? "");
      setSalesOrders(orderData ?? []);
      setLogoUrl(logoData?.valor ?? "");
      setBrandingForm(branding);
      setLoading(false);
    }

    loadAdmin();
  }, []);

  useEffect(() => {
    if (!selectedProduct) {
      setForm(emptyForm);
      return;
    }

    setForm({
      nombre: selectedProduct.nombre ?? "",
      descripcion: selectedProduct.descripcion ?? "",
      precio_original: selectedProduct.precio_original ?? "",
      precio_oferta: selectedProduct.precio_oferta ?? "",
      stock_quantity: selectedProduct.stock_quantity ?? "",
      categoria_id: selectedProduct.categoria_id ?? ""
    });
  }, [selectedProduct]);

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const updateBrandingForm = (event) => {
    const { name, value } = event.target;
    setBrandingForm((current) => ({ ...current, [name]: value }));
  };

  const saveBrandingForm = async (event) => {
    event.preventDefault();
    const { error } = await saveBranding(brandingForm);
    setStatus(error ? error.message : "Branding actualizado.");
  };

  const salesDashboard = useMemo(
    () => buildSalesDashboard(salesOrders, productos, categorias),
    [salesOrders, productos, categorias]
  );

  const validateCategory = () => {
    const categoryId = Number(form.categoria_id);
    const isInteger = Number.isInteger(categoryId);
    const exists = categorias.some((cat) => cat.id === categoryId);
    if (!isInteger || !exists) {
      setStatus("La categoria seleccionada no existe en la tabla maestra.");
      return null;
    }
    return categoryId;
  };

  const addCategory = async (event) => {
    event.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return;

    if (categorias.some((cat) => cat.nombre.toLowerCase() === name.toLowerCase())) {
      setStatus("Ya existe una categoria con ese nombre.");
      return;
    }

    if (!hasSupabaseConfig) {
      const nextId = Math.max(0, ...categorias.map((cat) => Number(cat.id))) + 1;
      const nextCategories = [...categorias, { id: nextId, nombre: name }].sort((a, b) =>
        a.nombre.localeCompare(b.nombre)
      );
      setCategorias(nextCategories);
      writeDemoCategories(nextCategories);
      setNewCategoryName("");
      setStatus("Categoria creada en modo demo.");
      return;
    }

    const { data, error } = await supabase.from("categorias").insert({ nombre: name }).select("*").single();
    if (error) {
      setStatus(error.message);
      return;
    }
    setCategorias((current) => [...current, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    setNewCategoryName("");
    setStatus("Categoria creada.");
  };

  const renameCategory = async (categoryId, nombre) => {
    const name = nombre.trim();
    if (!name) {
      setStatus("La categoria no puede quedar vacia.");
      return;
    }

    if (!hasSupabaseConfig) {
      const nextCategories = categorias
        .map((cat) => (cat.id === categoryId ? { ...cat, nombre: name } : cat))
        .sort((a, b) => a.nombre.localeCompare(b.nombre));
      setCategorias(nextCategories);
      writeDemoCategories(nextCategories);
      setStatus("Categoria actualizada en modo demo.");
      return;
    }

    const { error } = await supabase.from("categorias").update({ nombre: name }).eq("id", categoryId);
    if (error) {
      setStatus(error.message);
      return;
    }
    setCategorias((current) =>
      current
        .map((cat) => (cat.id === categoryId ? { ...cat, nombre: name } : cat))
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
    );
    setStatus("Categoria actualizada.");
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    if (!selectedProduct) return;

    const categoryId = validateCategory();
    if (!categoryId) return;

    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      precio_original: Number(form.precio_original),
      precio_oferta: form.precio_oferta === "" ? null : Number(form.precio_oferta),
      stock_quantity: Number(form.stock_quantity),
      categoria_id: categoryId
    };

    if (!hasSupabaseConfig) {
      setProductos((current) => {
        const nextProducts = current.map((product) =>
          product.id === selectedId ? { ...product, ...payload } : product
        );
        writeDemoProducts(nextProducts);
        return nextProducts;
      });
      setStatus("Producto actualizado en modo demo.");
      return;
    }

    const { error } = await supabase.from("productos").update(payload).eq("id", selectedId);
    setStatus(error ? error.message : "Producto actualizado.");
  };

  const uploadProductImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !selectedProduct) return;

    if (!hasSupabaseConfig) {
      const previewUrl = await fileToDataUrl(file);
      setProductos((current) => {
        const nextProducts = current.map((product) =>
          product.id === selectedId ? { ...product, imagenes: [previewUrl] } : product
        );
        writeDemoProducts(nextProducts);
        return nextProducts;
      });
      setStatus("Imagen aplicada al producto en modo demo.");
      return;
    }

    const path = `${selectedId}/${Date.now()}-${file.name}`;
    const upload = await supabase.storage.from("imagenes-productos").upload(path, file, {
      cacheControl: "3600",
      upsert: false
    });
    if (upload.error) {
      setStatus(upload.error.message);
      return;
    }

    const { data } = supabase.storage.from("imagenes-productos").getPublicUrl(path);
    const nextImages = [data.publicUrl, ...normalizeImages(selectedProduct.imagenes)];
    const { error } = await supabase
      .from("productos")
      .update({ imagenes: nextImages })
      .eq("id", selectedId);

    if (!error) {
      setProductos((current) =>
        current.map((product) =>
          product.id === selectedId ? { ...product, imagenes: nextImages } : product
        )
      );
    }
    setStatus(error ? error.message : "Imagen de producto actualizada.");
  };

  const uploadLogo = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!hasSupabaseConfig) {
      const previewUrl = await fileToDataUrl(file);
      setLogoUrl(previewUrl);
      writeDemoLogo(previewUrl);
      setStatus("Logo actualizado en modo demo.");
      return;
    }

    const path = `logo-${Date.now()}-${file.name}`;
    const upload = await supabase.storage.from("branding").upload(path, file, {
      cacheControl: "3600",
      upsert: true
    });
    if (upload.error) {
      setStatus(upload.error.message);
      return;
    }

    const { data } = supabase.storage.from("branding").getPublicUrl(path);
    const { error } = await supabase
      .from("configuracion_sitio")
      .upsert({ clave: "logo_url", valor: data.publicUrl });

    if (!error) setLogoUrl(data.publicUrl);
    setStatus(error ? error.message : "Logo principal actualizado.");
  };

  const uploadAboutImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!hasSupabaseConfig) {
      const previewUrl = await fileToDataUrl(file);
      const nextBranding = { ...brandingForm, about_image: previewUrl };
      setBrandingForm(nextBranding);
      await saveBranding(nextBranding);
      setStatus("Imagen de Acerca de Nomade actualizada en modo demo.");
      return;
    }

    const path = `about-${Date.now()}-${file.name}`;
    const upload = await supabase.storage.from("branding").upload(path, file, {
      cacheControl: "3600",
      upsert: true
    });
    if (upload.error) {
      setStatus(upload.error.message);
      return;
    }

    const { data } = supabase.storage.from("branding").getPublicUrl(path);
    const nextBranding = { ...brandingForm, about_image: data.publicUrl };
    setBrandingForm(nextBranding);
    const { error } = await saveBranding(nextBranding);
    setStatus(error ? error.message : "Imagen de Acerca de Nomade actualizada.");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] text-[#2C2A29]">
        <QuietLoader label="Abriendo backoffice" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#2C2A29]">
      <header className="border-b border-[#E5E2DE]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 md:px-8 lg:px-10">
          <Link
            to="/"
            className="flex items-center gap-3 font-sans text-[9pt] uppercase tracking-[0.2em] text-[#999591] hover:text-[#2C2A29]"
          >
            <ArrowLeft size={15} strokeWidth={1.5} />
            Catalogo
          </Link>
          <h1 className="font-serif text-3xl">Backoffice Nomade</h1>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-10 px-5 py-10 md:px-8 lg:grid-cols-[1.5fr_0.8fr] lg:px-10">
        <section className="space-y-8">
          <SalesDashboard dashboard={salesDashboard} />
          <SalesReport dashboard={salesDashboard} />
          <CategoryManager
            categorias={categorias}
            newCategoryName={newCategoryName}
            setNewCategoryName={setNewCategoryName}
            onAddCategory={addCategory}
            onRenameCategory={renameCategory}
          />

          <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
            <div>
              <p className="mb-4 font-sans text-[9pt] uppercase tracking-[0.2em] text-[#999591]">
                Productos
              </p>
              <div className="quiet-scrollbar max-h-[560px] space-y-2 overflow-auto pr-2">
                {productos.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => setSelectedId(product.id)}
                    className={`w-full border px-4 py-3 text-left transition ${
                      selectedId === product.id
                        ? "border-[#2C2A29]"
                        : "border-[#E5E2DE] hover:border-[#B8B2AB]"
                    }`}
                  >
                    <span className="block font-serif text-lg">{product.nombre}</span>
                    <span className="mt-1 block font-sans text-[9pt] uppercase tracking-[0.2em] text-[#999591]">
                      {formatCurrency(product.precio_oferta ?? product.precio_original)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={saveProduct} className="animate-fadeIn space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Nombre">
                  <input name="nombre" value={form.nombre} onChange={updateForm} className="input" />
                </Field>
                <Field label="Categoria">
                  <select
                    name="categoria_id"
                    value={form.categoria_id}
                    onChange={updateForm}
                    className="input"
                  >
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.id} / {cat.nombre}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Precio original">
                  <input
                    name="precio_original"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.precio_original}
                    onChange={updateForm}
                    className="input"
                  />
                </Field>
                <Field label="Precio oferta">
                  <input
                    name="precio_oferta"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.precio_oferta ?? ""}
                    onChange={updateForm}
                    className="input"
                  />
                </Field>
                <Field label="Stock">
                  <input
                    name="stock_quantity"
                    type="number"
                    min="0"
                    value={form.stock_quantity}
                    onChange={updateForm}
                    className="input"
                  />
                </Field>
              </div>

              <Field label="Descripcion tecnica">
                <textarea
                  name="descripcion"
                  value={form.descripcion}
                  onChange={updateForm}
                  rows="7"
                  className="input resize-none leading-7"
                />
              </Field>

              <button
                type="submit"
                className="inline-flex items-center gap-3 border border-[#2C2A29] px-5 py-3 font-sans text-[9pt] uppercase tracking-[0.2em] transition hover:bg-[#2C2A29] hover:text-[#FAF9F6]"
              >
                <Save size={15} strokeWidth={1.5} />
                Guardar producto
              </button>
            </form>
          </div>
        </section>

        <aside className="space-y-8 border-l border-[#E5E2DE] pl-8">
          <section>
            <p className="font-sans text-[9pt] uppercase tracking-[0.2em] text-[#999591]">
              Medios de producto
            </p>
            <div className="mt-5 overflow-hidden bg-[#F0EEE9]">
              {selectedProduct && (
                <img
                  src={firstImage(selectedProduct)}
                  alt={selectedProduct.nombre}
                  className="aspect-[4/5] w-full object-cover"
                />
              )}
            </div>
            <label className="mt-5 flex cursor-pointer items-center justify-center gap-3 border border-[#E5E2DE] px-5 py-3 font-sans text-[9pt] uppercase tracking-[0.2em] transition hover:border-[#2C2A29]">
              <ImageUp size={15} strokeWidth={1.5} />
              Subir imagen
              <input type="file" accept="image/*" onChange={uploadProductImage} className="hidden" />
            </label>
          </section>

          <section className="border-t border-[#E5E2DE] pt-8">
            <p className="font-sans text-[9pt] uppercase tracking-[0.2em] text-[#999591]">
              Branding
            </p>
            <div className="mt-5 flex min-h-24 items-center justify-center border border-[#E5E2DE] p-6">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo Nomade"
                  className="h-auto max-h-32 max-w-full object-contain"
                />
              ) : (
                <span className="font-serif text-2xl">Nomade Project</span>
              )}
            </div>
            <label className="mt-5 flex cursor-pointer items-center justify-center gap-3 border border-[#E5E2DE] px-5 py-3 font-sans text-[9pt] uppercase tracking-[0.2em] transition hover:border-[#2C2A29]">
              <Upload size={15} strokeWidth={1.5} />
              Cambiar logo
              <input type="file" accept="image/*" onChange={uploadLogo} className="hidden" />
            </label>

            <form onSubmit={saveBrandingForm} className="mt-8 space-y-4 border-t border-[#E5E2DE] pt-8">
              <Field label="Texto contacto">
                <input
                  name="contact_heading"
                  value={brandingForm.contact_heading}
                  onChange={updateBrandingForm}
                  className="input"
                />
              </Field>
              <Field label="Whatsapp">
                <input
                  name="contact_whatsapp"
                  value={brandingForm.contact_whatsapp}
                  onChange={updateBrandingForm}
                  className="input"
                />
              </Field>
              <Field label="Mail">
                <input
                  name="contact_mail"
                  value={brandingForm.contact_mail}
                  onChange={updateBrandingForm}
                  className="input"
                />
              </Field>
              <Field label="Texto redes">
                <input
                  name="social_heading"
                  value={brandingForm.social_heading}
                  onChange={updateBrandingForm}
                  className="input"
                />
              </Field>
              <Field label="Instagram">
                <input
                  name="social_instagram"
                  value={brandingForm.social_instagram}
                  onChange={updateBrandingForm}
                  className="input"
                />
              </Field>
              <Field label="Facebook">
                <input
                  name="social_facebook"
                  value={brandingForm.social_facebook}
                  onChange={updateBrandingForm}
                  className="input"
                />
              </Field>
              <Field label="Titulo acerca">
                <input
                  name="about_title"
                  value={brandingForm.about_title}
                  onChange={updateBrandingForm}
                  className="input"
                />
              </Field>
              <Field label="Contenido acerca">
                <textarea
                  name="about_content"
                  value={brandingForm.about_content}
                  onChange={updateBrandingForm}
                  rows="6"
                  className="input resize-none leading-7"
                />
              </Field>
              <Field label="Imagen acerca URL">
                <input
                  name="about_image"
                  value={brandingForm.about_image}
                  onChange={updateBrandingForm}
                  className="input"
                />
              </Field>
              <label className="flex cursor-pointer items-center justify-center gap-3 border border-[#E5E2DE] px-5 py-3 font-sans text-[9pt] uppercase tracking-[0.2em] transition hover:border-[#2C2A29]">
                <ImageUp size={15} strokeWidth={1.5} />
                Subir imagen acerca
                <input type="file" accept="image/*" onChange={uploadAboutImage} className="hidden" />
              </label>
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-3 border border-[#2C2A29] px-5 py-3 font-sans text-[9pt] uppercase tracking-[0.2em] transition hover:bg-[#2C2A29] hover:text-[#FAF9F6]"
              >
                <Save size={15} strokeWidth={1.5} />
                Guardar branding
              </button>
            </form>
          </section>

          {status && (
            <p className="animate-fadeIn border-t border-[#E5E2DE] pt-6 font-serif text-lg leading-7 text-[#5F5A55]">
              {status}
            </p>
          )}
        </aside>
      </main>
    </div>
  );
}

function buildSalesDashboard(orders, products, categories) {
  const productCategory = new Map(products.map((product) => [product.id, product.categoria_id]));
  const productNames = new Map(products.map((product) => [product.id, product.nombre]));
  const categoryNames = new Map(categories.map((cat) => [cat.id, cat.nombre]));
  const categoryMap = new Map();
  const productMap = new Map();

  const paidOrders = orders.filter((order) => order.status_pago === "pagado");
  const totals = paidOrders.reduce(
    (acc, order) => {
      const orderTotal = Number(order.total ?? 0);
      const shippingCost = Number(order.shipping_cost ?? 0);
      const items = Array.isArray(order.items) ? order.items : normalizeImages(order.items);

      acc.revenue += orderTotal;
      acc.shipping += shippingCost;
      acc.orders += 1;
      if (order.delivery_method === "domicilio") acc.delivery += 1;
      if (order.delivery_method === "retiro") acc.pickup += 1;

      items.forEach((item) => {
        const quantity = Number(item.quantity ?? 0);
        const unitPrice = Number(item.unit_price ?? 0);
        const categoryId = Number(item.categoria_id ?? productCategory.get(item.id));
        const categoryName = categoryNames.get(categoryId) ?? "Sin categoria";
        const productName = productNames.get(item.id) ?? item.nombre ?? "Producto sin nombre";
        const current = categoryMap.get(categoryName) ?? { name: categoryName, units: 0, revenue: 0 };
        current.units += quantity;
        current.revenue += quantity * unitPrice;
        categoryMap.set(categoryName, current);

        const productKey = `${categoryName}-${item.id}`;
        const currentProduct = productMap.get(productKey) ?? {
          id: item.id,
          name: productName,
          categoryName,
          units: 0,
          revenue: 0
        };
        currentProduct.units += quantity;
        currentProduct.revenue += quantity * unitPrice;
        productMap.set(productKey, currentProduct);
        acc.units += quantity;
      });

      return acc;
    },
    { revenue: 0, shipping: 0, orders: 0, units: 0, delivery: 0, pickup: 0 }
  );

  const categoryRows = [...categoryMap.values()].sort((a, b) => b.revenue - a.revenue);
  const productRows = [...productMap.values()].sort((a, b) => {
    if (a.categoryName === b.categoryName) return b.revenue - a.revenue;
    return a.categoryName.localeCompare(b.categoryName);
  });
  const maxCategoryRevenue = Math.max(...categoryRows.map((row) => row.revenue), 1);

  return {
    ...totals,
    averageOrder: totals.orders ? totals.revenue / totals.orders : 0,
    productRows,
    categoryRows: categoryRows.map((row) => ({
      ...row,
      share: row.revenue / maxCategoryRevenue
    }))
  };
}

function generateSalesPdf(dashboard) {
  const generatedAt = new Date().toLocaleString("es-CL");
  const rows = dashboard.productRows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.categoryName)}</td>
          <td>${escapeHtml(row.name)}</td>
          <td class="number">${row.units}</td>
          <td class="number">${formatCurrency(row.revenue)}</td>
        </tr>
      `
    )
    .join("");
  const categoryRows = dashboard.categoryRows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.name)}</td>
          <td class="number">${row.units}</td>
          <td class="number">${formatCurrency(row.revenue)}</td>
        </tr>
      `
    )
    .join("");

  const reportWindow = window.open("", "_blank", "width=960,height=720");
  if (!reportWindow) return;

  reportWindow.document.write(`
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>Reporte de ventas Nomade</title>
        <style>
          @page { margin: 22mm; }
          body { color: #2C2A29; font-family: Arial, sans-serif; background: #FAF9F6; }
          h1, h2 { font-family: Georgia, serif; font-weight: 400; }
          h1 { font-size: 34px; margin: 0 0 8px; }
          h2 { font-size: 22px; margin: 28px 0 12px; }
          p, th { color: #77716B; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; background: transparent; }
          th, td { border-bottom: 1px solid #E5E2DE; padding: 10px 8px; text-align: left; font-size: 12px; }
          .number { text-align: right; }
          .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-top: 26px; }
          .metric { border: 1px solid #E5E2DE; padding: 14px; }
          .metric strong { display: block; margin-top: 8px; font-family: Georgia, serif; font-size: 22px; font-weight: 400; }
          @media print { body { background: white; } }
        </style>
      </head>
      <body>
        <h1>Reporte de ventas Nomade</h1>
        <p>Generado ${generatedAt}</p>
        <section class="metrics">
          <div class="metric"><p>Ingresos pagados</p><strong>${formatCurrency(dashboard.revenue)}</strong></div>
          <div class="metric"><p>Pedidos pagados</p><strong>${dashboard.orders}</strong></div>
          <div class="metric"><p>Unidades vendidas</p><strong>${dashboard.units}</strong></div>
          <div class="metric"><p>Ticket promedio</p><strong>${formatCurrency(dashboard.averageOrder)}</strong></div>
        </section>

        <h2>Rendimiento por producto</h2>
        <table>
          <thead><tr><th>Categoria</th><th>Producto</th><th class="number">Unidades</th><th class="number">Ventas</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="4">Sin ventas pagadas.</td></tr>'}</tbody>
        </table>

        <h2>Subtotales por categoria</h2>
        <table>
          <thead><tr><th>Categoria</th><th class="number">Unidades</th><th class="number">Subtotal</th></tr></thead>
          <tbody>${categoryRows || '<tr><td colspan="3">Sin ventas pagadas.</td></tr>'}</tbody>
        </table>
      </body>
    </html>
  `);
  reportWindow.document.close();
  reportWindow.focus();
  reportWindow.print();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function SalesDashboard({ dashboard }) {
  return (
    <section className="border-b border-[#E5E2DE] pb-8">
      <div className="mb-6 flex items-center justify-between gap-5">
        <div>
          <p className="font-sans text-[9pt] uppercase tracking-[0.2em] text-[#999591]">
            Dashboard de ventas
          </p>
          <h2 className="mt-3 font-serif text-4xl">Integridad financiera</h2>
        </div>
        <TrendingUp size={22} strokeWidth={1.4} className="text-[#999591]" />
      </div>

      <div className="grid gap-5 md:grid-cols-4">
        <Metric label="Ingresos pagados" value={formatCurrency(dashboard.revenue)} />
        <Metric label="Pedidos pagados" value={dashboard.orders} />
        <Metric label="Unidades vendidas" value={dashboard.units} />
        <Metric label="Ticket promedio" value={formatCurrency(dashboard.averageOrder)} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <p className="mb-4 font-sans text-[9pt] uppercase tracking-[0.2em] text-[#999591]">
            Rendimiento por categoria
          </p>
          <div className="space-y-4">
            {dashboard.categoryRows.length === 0 ? (
              <p className="font-serif text-lg leading-7 text-[#5F5A55]">
                Aun no hay pedidos pagados con items para auditar por categoria.
              </p>
            ) : (
              dashboard.categoryRows.map((row) => (
                <div key={row.name}>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <span className="font-serif text-lg">{row.name}</span>
                    <span className="font-sans text-[9pt] uppercase tracking-[0.2em] text-[#999591]">
                      {formatCurrency(row.revenue)} / {row.units} uds.
                    </span>
                  </div>
                  <div className="h-2 bg-[#E5E2DE]">
                    <div
                      className="h-full bg-[#2C2A29]"
                      style={{ width: `${Math.max(row.share * 100, 4)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="border-l border-[#E5E2DE] pl-6">
          <p className="font-sans text-[9pt] uppercase tracking-[0.2em] text-[#999591]">
            Auditoria operativa
          </p>
          <div className="mt-5 space-y-5">
            <AuditLine label="Retiro en tienda" value={dashboard.pickup} />
            <AuditLine label="Envio a domicilio" value={dashboard.delivery} />
            <AuditLine label="Ingresos por envio" value={formatCurrency(dashboard.shipping)} />
          </div>
        </div>
      </div>
    </section>
  );
}

function SalesReport({ dashboard }) {
  return (
    <section className="border-b border-[#E5E2DE] pb-8">
      <div className="mb-6 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="font-sans text-[9pt] uppercase tracking-[0.2em] text-[#999591]">
            Reporte exportable
          </p>
          <h2 className="mt-3 font-serif text-3xl">Ventas por producto</h2>
        </div>
        <button
          type="button"
          onClick={() => generateSalesPdf(dashboard)}
          className="inline-flex items-center justify-center gap-3 border border-[#2C2A29] px-5 py-3 font-sans text-[9pt] uppercase tracking-[0.2em] transition hover:bg-[#2C2A29] hover:text-[#FAF9F6]"
        >
          <FileText size={15} strokeWidth={1.5} />
          Generar PDF
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse">
          <thead>
            <tr className="border-b border-[#E5E2DE]">
              <th className="py-3 pr-4 text-left font-sans text-[9pt] uppercase tracking-[0.2em] text-[#999591]">
                Categoria
              </th>
              <th className="py-3 pr-4 text-left font-sans text-[9pt] uppercase tracking-[0.2em] text-[#999591]">
                Producto
              </th>
              <th className="py-3 pr-4 text-right font-sans text-[9pt] uppercase tracking-[0.2em] text-[#999591]">
                Unidades
              </th>
              <th className="py-3 text-right font-sans text-[9pt] uppercase tracking-[0.2em] text-[#999591]">
                Ventas
              </th>
            </tr>
          </thead>
          <tbody>
            {dashboard.productRows.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-5 font-serif text-lg text-[#5F5A55]">
                  Sin ventas pagadas para listar.
                </td>
              </tr>
            ) : (
              dashboard.productRows.map((row) => (
                <tr key={`${row.categoryName}-${row.id}`} className="border-b border-[#E5E2DE]">
                  <td className="py-4 pr-4 font-serif text-base">{row.categoryName}</td>
                  <td className="py-4 pr-4 font-serif text-base">{row.name}</td>
                  <td className="py-4 pr-4 text-right font-sans text-[9pt] uppercase tracking-[0.2em] text-[#999591]">
                    {row.units}
                  </td>
                  <td className="py-4 text-right font-sans text-[9pt] uppercase tracking-[0.2em] text-[#2C2A29]">
                    {formatCurrency(row.revenue)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-7 grid gap-4 md:grid-cols-3">
        {dashboard.categoryRows.map((row) => (
          <div key={row.name} className="border border-[#E5E2DE] p-4">
            <p className="font-sans text-[9pt] uppercase tracking-[0.2em] text-[#999591]">
              Subtotal categoria
            </p>
            <p className="mt-3 font-serif text-2xl">{row.name}</p>
            <div className="mt-4 flex items-center justify-between gap-4 font-sans text-[9pt] uppercase tracking-[0.2em] text-[#999591]">
              <span>{row.units} uds.</span>
              <span className="text-[#2C2A29]">{formatCurrency(row.revenue)}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CategoryManager({
  categorias,
  newCategoryName,
  setNewCategoryName,
  onAddCategory,
  onRenameCategory
}) {
  const [drafts, setDrafts] = useState({});

  useEffect(() => {
    setDrafts(Object.fromEntries(categorias.map((cat) => [cat.id, cat.nombre])));
  }, [categorias]);

  return (
    <section className="border-b border-[#E5E2DE] pb-8">
      <div className="mb-6">
        <p className="font-sans text-[9pt] uppercase tracking-[0.2em] text-[#999591]">
          Maestro de categorias
        </p>
        <h2 className="mt-3 font-serif text-3xl">Lista y validacion</h2>
      </div>

      <form onSubmit={onAddCategory} className="mb-6 flex flex-col gap-3 md:flex-row">
        <input
          value={newCategoryName}
          onChange={(event) => setNewCategoryName(event.target.value)}
          placeholder="Nueva categoria"
          className="input md:flex-1"
        />
        <button
          type="submit"
          className="border border-[#2C2A29] px-5 py-3 font-sans text-[9pt] uppercase tracking-[0.2em] transition hover:bg-[#2C2A29] hover:text-[#FAF9F6]"
        >
          Agregar categoria
        </button>
      </form>

      <div className="grid gap-3 md:grid-cols-2">
        {categorias.map((cat) => (
          <div key={cat.id} className="flex gap-3 border border-[#E5E2DE] p-3">
            <div className="flex h-11 w-12 shrink-0 items-center justify-center border border-[#E5E2DE] font-sans text-[9pt] uppercase tracking-[0.2em] text-[#999591]">
              {cat.id}
            </div>
            <input
              value={drafts[cat.id] ?? cat.nombre}
              onChange={(event) =>
                setDrafts((current) => ({ ...current, [cat.id]: event.target.value }))
              }
              className="input min-w-0 flex-1"
            />
            <button
              type="button"
              onClick={() => onRenameCategory(cat.id, drafts[cat.id] ?? cat.nombre)}
              className="border border-[#E5E2DE] px-4 font-sans text-[9pt] uppercase tracking-[0.2em] text-[#999591] transition hover:border-[#2C2A29] hover:text-[#2C2A29]"
            >
              Guardar
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function AuditLine({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#E5E2DE] pb-3">
      <span className="font-sans text-[9pt] uppercase tracking-[0.2em] text-[#999591]">{label}</span>
      <span className="font-serif text-2xl">{value}</span>
    </div>
  );
}

function normalizeImages(value) {
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value ?? "[]");
  } catch {
    return [];
  }
}

function Metric({ label, value }) {
  return (
    <div>
      <p className="font-sans text-[9pt] uppercase tracking-[0.2em] text-[#999591]">{label}</p>
      <p className="mt-3 font-serif text-3xl">{value}</p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block font-sans text-[9pt] uppercase tracking-[0.2em] text-[#999591]">
        {label}
      </span>
      {children}
    </label>
  );
}
