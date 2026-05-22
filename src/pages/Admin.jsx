import React from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, ClipboardList, FileText, ImageUp, LogOut, MapPinned, Palette, Percent, Plus, Save, Tags, Trash2, TrendingUp, Upload } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import QuietLoader from "../components/QuietLoader.jsx";
import { loadBranding, saveBranding } from "../lib/branding.js";
import { loadShippingSettings, saveShippingSettings } from "../lib/shipping.js";
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
import { effectivePrice, formatCurrency, firstImage } from "../utils/format.js";

const emptyForm = {
  nombre: "",
  descripcion: "",
  precio_original: "",
  precio_oferta: "",
  stock_quantity: "",
  categoria_id: "",
  talles: "",
  medidas: "",
  slug: "",
  sku: "",
  material: "",
  origen: "",
  color: "",
  peso: "",
  cuidados: "",
  tiempo_despacho: "",
  es_oferta: false,
  es_novedad: false
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
  about_image: "",
  tax_condition: "exento",
  tax_percent: "19",
  status_banner: "",
  reservation_minutes: "60",
  policy_returns: "",
  policy_shipping: "",
  policy_terms: "",
  policy_privacy: "",
  policy_faq: ""
};

const adminSections = [
  { id: "finanzas", title: "Integridad financiera", eyebrow: "Dashboard de ventas", icon: TrendingUp },
  { id: "ventas-producto", title: "Ventas por producto", eyebrow: "Reporte exportable", icon: FileText },
  { id: "categorias", title: "Maestro de Categorias", eyebrow: "Catalogo", icon: Tags },
  { id: "productos", title: "Maestro de Productos", eyebrow: "Catalogo", icon: ClipboardList },
  { id: "branding", title: "Branding", eyebrow: "Identidad y politicas", icon: Palette },
  { id: "regiones", title: "Maestro de Regiones", eyebrow: "Costos de envio", icon: MapPinned },
  { id: "acerca", title: "Acerca de Nomade", eyebrow: "Historia editorial", icon: BookOpen },
  { id: "codigos", title: "Codigos Comerciales", eyebrow: "Cupones", icon: Percent }
];

export default function Admin() {
  const { section = "" } = useParams();
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(!hasSupabaseConfig);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [categorias, setCategorias] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [productos, setProductos] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [brandingForm, setBrandingForm] = useState(emptyBranding);
  const [savedBrandingForm, setSavedBrandingForm] = useState(emptyBranding);
  const [shippingForm, setShippingForm] = useState({ regions: [], notes: "" });
  const [savedShippingForm, setSavedShippingForm] = useState({ regions: [], notes: "" });
  const [logoUrl, setLogoUrl] = useState("");
  const [salesOrders, setSalesOrders] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [newCoupon, setNewCoupon] = useState({ codigo: "", tipo: "porcentaje", valor: "", activo: true });
  const [salesFrom, setSalesFrom] = useState("");
  const [salesTo, setSalesTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  const selectedProduct = useMemo(
    () => productos.find((product) => product.id === selectedId),
    [productos, selectedId]
  );
  const activeCategories = useMemo(() => categorias.filter((cat) => cat.activo !== false), [categorias]);
  const inactiveCategories = useMemo(() => categorias.filter((cat) => cat.activo === false), [categorias]);
  const activeProducts = useMemo(() => productos.filter((product) => product.activo !== false), [productos]);
  const inactiveProducts = useMemo(() => productos.filter((product) => product.activo === false), [productos]);
  const productDirty = useMemo(() => {
    if (!selectedProduct) return false;
    return (
      form.nombre !== (selectedProduct.nombre ?? "") ||
      form.descripcion !== (selectedProduct.descripcion ?? "") ||
      Number(form.precio_original || 0) !== Number(selectedProduct.precio_original ?? 0) ||
      (form.precio_oferta === "" ? null : Number(form.precio_oferta)) !== (selectedProduct.precio_oferta ?? null) ||
      Number(form.stock_quantity || 0) !== Number(selectedProduct.stock_quantity ?? 0) ||
      Number(form.categoria_id) !== Number(selectedProduct.categoria_id) ||
      form.talles !== (selectedProduct.talles ?? "") ||
      form.medidas !== (selectedProduct.medidas ?? "") ||
      form.slug !== (selectedProduct.slug ?? "") ||
      form.sku !== (selectedProduct.sku ?? "") ||
      form.material !== (selectedProduct.material ?? "") ||
      form.origen !== (selectedProduct.origen ?? "") ||
      form.color !== (selectedProduct.color ?? "") ||
      form.peso !== (selectedProduct.peso ?? "") ||
      form.cuidados !== (selectedProduct.cuidados ?? "") ||
      form.tiempo_despacho !== (selectedProduct.tiempo_despacho ?? "") ||
      form.es_oferta !== (selectedProduct.es_oferta === true) ||
      form.es_novedad !== (selectedProduct.es_novedad === true)
    );
  }, [form, selectedProduct]);
  const brandingDirty = useMemo(
    () => JSON.stringify(brandingForm) !== JSON.stringify(savedBrandingForm),
    [brandingForm, savedBrandingForm]
  );
  const shippingDirty = useMemo(
    () => JSON.stringify(shippingForm) !== JSON.stringify(savedShippingForm),
    [shippingForm, savedShippingForm]
  );
  const activeSection = adminSections.some((item) => item.id === section) ? section : "";

  useEffect(() => {
    if (!hasSupabaseConfig) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function loadAdmin() {
      setLoading(true);
      if (hasSupabaseConfig && !session) {
        setLoading(false);
        return;
      }

      if (!hasSupabaseConfig) {
        const demoProductos = readDemoProducts();
        const branding = await loadBranding();
        const shipping = await loadShippingSettings();
        setCategorias(readDemoCategories());
        setProductos(demoProductos);
        setSelectedId(demoProductos[0]?.id ?? "");
        setSalesOrders(readDemoOrders().filter((order) => order.status_pago === "pagado"));
        setCoupons([{ codigo: "NOMADE10", tipo: "porcentaje", valor: 10, activo: true }]);
        setAuditLogs([]);
        setLogoUrl(readDemoLogo());
        setBrandingForm(branding);
        setSavedBrandingForm(branding);
        setShippingForm(shipping);
        setSavedShippingForm(shipping);
        setLoading(false);
        return;
      }

      const [
        { data: categoryData },
        { data: productData },
        { data: orderData },
        { data: couponData },
        { data: auditData },
        { data: logoData },
        branding,
        shipping
      ] =
        await Promise.all([
          supabase.from("categorias").select("*").order("nombre"),
          supabase.from("productos").select("*").order("nombre"),
          supabase
            .from("pedidos")
            .select(
              "total, subtotal, shipping_cost, card_surcharge, tax_amount, delivery_method, payment_method, status_pago, items, created_at"
            )
            .eq("status_pago", "pagado"),
          supabase.from("cupones").select("*").order("codigo"),
          supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(12),
          supabase.from("configuracion_sitio").select("valor").eq("clave", "logo_url").single(),
          loadBranding(),
          loadShippingSettings()
        ]);

      setCategorias(categoryData ?? []);
      setProductos(productData ?? []);
      setSelectedId(productData?.[0]?.id ?? "");
      setSalesOrders(orderData ?? []);
      setCoupons(couponData ?? []);
      setAuditLogs(auditData ?? []);
      setLogoUrl(logoData?.valor ?? "");
      setBrandingForm(branding);
      setSavedBrandingForm(branding);
      setShippingForm(shipping);
      setSavedShippingForm(shipping);
      setLoading(false);
    }

    if (authReady) loadAdmin();
  }, [authReady, session]);

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
      categoria_id: selectedProduct.categoria_id ?? "",
      talles: selectedProduct.talles ?? "",
      medidas: selectedProduct.medidas ?? "",
      slug: selectedProduct.slug ?? "",
      sku: selectedProduct.sku ?? "",
      material: selectedProduct.material ?? "",
      origen: selectedProduct.origen ?? "",
      color: selectedProduct.color ?? "",
      peso: selectedProduct.peso ?? "",
      cuidados: selectedProduct.cuidados ?? "",
      tiempo_despacho: selectedProduct.tiempo_despacho ?? "",
      es_oferta: selectedProduct.es_oferta === true,
      es_novedad: selectedProduct.es_novedad === true
    });
  }, [selectedProduct]);

  const updateForm = (event) => {
    const { name, value } = event.target;
    const nextValue = event.target.type === "checkbox" ? event.target.checked : value;
    setForm((current) => ({ ...current, [name]: nextValue }));
  };

  const updateLoginForm = (event) => {
    const { name, value } = event.target;
    setLoginForm((current) => ({ ...current, [name]: value }));
  };

  const signInAdmin = async (event) => {
    event.preventDefault();
    setStatus("");
    const { error } = await supabase.auth.signInWithPassword({
      email: loginForm.email,
      password: loginForm.password
    });
    if (error) setStatus(error.message);
  };

  const signOutAdmin = async () => {
    await supabase.auth.signOut();
    setProductos([]);
    setCategorias([]);
    setSelectedId("");
  };

  const updateBrandingForm = (event) => {
    const { name, value } = event.target;
    setBrandingForm((current) => ({ ...current, [name]: value }));
  };

  const updateShippingRegion = (regionId, field, value) => {
    setShippingForm((current) => ({
      ...current,
      regions: current.regions.map((region) =>
        region.id === regionId
          ? { ...region, [field]: field === "costo" ? Math.max(0, Number(value || 0)) : value }
          : region
      )
    }));
  };

  const updateShippingNotes = (event) => {
    setShippingForm((current) => ({ ...current, notes: event.target.value }));
  };

  const saveShippingForm = async (event) => {
    event.preventDefault();
    const { error } = await saveShippingSettings(shippingForm);
    if (!error) {
      setSavedShippingForm(shippingForm);
      await logAudit("regiones", "shipping_regions", "update", {
        regiones: shippingForm.regions.length,
        observaciones: Boolean(shippingForm.notes)
      });
    }
    setStatus(error ? error.message : "Regiones y costos de envio actualizados.");
  };

  const saveBrandingForm = async (event) => {
    event.preventDefault();
    const { error } = await saveBranding(brandingForm);
    if (!error) {
      setSavedBrandingForm(brandingForm);
      await logAudit("branding", "configuracion_sitio", "update", { keys: Object.keys(brandingForm) });
    }
    setStatus(error ? error.message : "Branding actualizado.");
  };

  const logAudit = async (entidad, entidadId, accion, detalle = {}) => {
    if (!hasSupabaseConfig || !session) return;
    await supabase.from("audit_log").insert({
      actor_email: session.user?.email ?? "",
      entidad,
      entidad_id: String(entidadId),
      accion,
      detalle
    });
    const { data } = await supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(12);
    setAuditLogs(data ?? []);
  };

  const filteredSalesOrders = useMemo(
    () => filterOrdersByDateRange(salesOrders, salesFrom, salesTo),
    [salesOrders, salesFrom, salesTo]
  );

  const salesDashboard = useMemo(
    () => buildSalesDashboard(filteredSalesOrders, productos, categorias),
    [filteredSalesOrders, productos, categorias]
  );

  const validateCategory = () => {
    const categoryId = Number(form.categoria_id);
    const isInteger = Number.isInteger(categoryId);
    const exists = activeCategories.some((cat) => cat.id === categoryId);
    if (!isInteger || !exists) {
      setStatus("La categoria seleccionada no existe o esta dada de baja.");
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
      const nextCategories = [...categorias, { id: nextId, nombre: name, activo: true }].sort((a, b) =>
        a.nombre.localeCompare(b.nombre)
      );
      setCategorias(nextCategories);
      writeDemoCategories(nextCategories);
      setNewCategoryName("");
      setStatus("Categoria creada en modo demo.");
      return;
    }

    const { data, error } = await supabase.from("categorias").insert({ nombre: name, activo: true }).select("*").single();
    if (error) {
      setStatus(error.message);
      return;
    }
    setCategorias((current) => [...current, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    await logAudit("categoria", data.id, "create", { nombre: name });
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
    await logAudit("categoria", categoryId, "update", { nombre: name });
    setStatus("Categoria actualizada.");
  };

  const toggleCategoryStatus = async (categoryId) => {
    const category = categorias.find((cat) => cat.id === categoryId);
    if (!category) return;
    const nextActive = category.activo === false;

    if (!nextActive) {
      const hasProducts = productos.some((product) => product.categoria_id === categoryId && product.activo !== false);
      if (hasProducts) {
        setStatus("No se puede dar de baja una categoria con productos activos asignados.");
        return;
      }
      const confirmed = window.confirm("Dar de baja esta categoria? Dejara de aparecer en el catalogo.");
      if (!confirmed) return;
    }

    if (!hasSupabaseConfig) {
      const nextCategories = categorias
        .map((cat) => (cat.id === categoryId ? { ...cat, activo: nextActive } : cat))
        .sort((a, b) => a.nombre.localeCompare(b.nombre));
      setCategorias(nextCategories);
      writeDemoCategories(nextCategories);
      setStatus(nextActive ? "Categoria reactivada en modo demo." : "Categoria dada de baja en modo demo.");
      return;
    }

    const { error } = await supabase.from("categorias").update({ activo: nextActive }).eq("id", categoryId);
    if (error) {
      setStatus(error.message);
      return;
    }
    setCategorias((current) =>
      current
        .map((cat) => (cat.id === categoryId ? { ...cat, activo: nextActive } : cat))
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
    );
    await logAudit("categoria", categoryId, nextActive ? "reactivate" : "deactivate", {});
    setStatus(nextActive ? "Categoria reactivada." : "Categoria dada de baja.");
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
      categoria_id: categoryId,
      talles: form.talles.trim(),
      medidas: form.medidas.trim(),
      slug: form.slug.trim(),
      sku: form.sku.trim(),
      material: form.material.trim(),
      origen: form.origen.trim(),
      color: form.color.trim(),
      peso: form.peso.trim(),
      cuidados: form.cuidados.trim(),
      tiempo_despacho: form.tiempo_despacho.trim(),
      es_oferta: form.es_oferta === true,
      es_novedad: form.es_novedad === true
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
    if (error) {
      setStatus(error.message);
      return;
    }

    setProductos((current) =>
      current.map((product) => (product.id === selectedId ? { ...product, ...payload } : product))
    );
    await logAudit("producto", selectedId, "update", payload);
    setStatus("Producto actualizado.");
  };

  const createProduct = async () => {
    const firstCategory = categorias[0];
    if (!firstCategory) {
      setStatus("Primero crea una categoria en el maestro de categorias.");
      return;
    }

    const payload = {
      nombre: "Nuevo producto",
      descripcion: "Descripcion tecnica del producto.",
      precio_original: 0,
      precio_oferta: null,
      stock_quantity: 0,
      categoria_id: Number(firstCategory.id),
      activo: true,
      es_oferta: false,
      es_novedad: false,
      talles: "",
      medidas: "",
      slug: "",
      sku: "",
      material: "",
      origen: "",
      color: "",
      peso: "",
      cuidados: "",
      tiempo_despacho: "",
      imagenes: []
    };

    if (!hasSupabaseConfig) {
      const product = { ...payload, id: crypto.randomUUID() };
      const nextProducts = [product, ...productos];
      setProductos(nextProducts);
      writeDemoProducts(nextProducts);
      setSelectedId(product.id);
      setStatus("Producto creado en modo demo.");
      return;
    }

    const { data, error } = await supabase.from("productos").insert(payload).select("*").single();
    if (error) {
      setStatus(error.message);
      return;
    }
    setProductos((current) => [data, ...current]);
    setSelectedId(data.id);
    await logAudit("producto", data.id, "create", { nombre: data.nombre });
    setStatus("Producto creado.");
  };

  const toggleProductStatus = async () => {
    if (!selectedProduct) return;

    const nextActive = selectedProduct.activo === false;
    const statusLabel = nextActive ? "reactivado" : "dado de baja";

    if (!nextActive) {
      const confirmed = window.confirm(
        "Dar de baja este producto? Dejara de aparecer en el catalogo publico."
      );
      if (!confirmed) return;
    }

    if (!hasSupabaseConfig) {
      setProductos((current) => {
        const nextProducts = current.map((product) =>
          product.id === selectedId ? { ...product, activo: nextActive } : product
        );
        writeDemoProducts(nextProducts);
        return nextProducts;
      });
      setStatus(`Producto ${statusLabel} en modo demo.`);
      return;
    }

    const { error } = await supabase.from("productos").update({ activo: nextActive }).eq("id", selectedId);
    if (error) {
      setStatus(error.message);
      return;
    }

    setProductos((current) =>
      current.map((product) => (product.id === selectedId ? { ...product, activo: nextActive } : product))
    );
    await logAudit("producto", selectedId, nextActive ? "reactivate" : "deactivate", {});
    setStatus(`Producto ${statusLabel}.`);
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
      setSavedBrandingForm(nextBranding);
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
    if (!error) setSavedBrandingForm(nextBranding);
    setStatus(error ? error.message : "Imagen de Acerca de Nomade actualizada.");
  };

  const updateNewCoupon = (event) => {
    const { name, value, type, checked } = event.target;
    setNewCoupon((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const saveCoupon = async (event) => {
    event.preventDefault();
    const payload = {
      codigo: newCoupon.codigo.trim().toUpperCase(),
      tipo: newCoupon.tipo,
      valor: Number(newCoupon.valor),
      activo: newCoupon.activo
    };
    if (!payload.codigo || Number.isNaN(payload.valor)) {
      setStatus("Completa codigo y valor del cupon.");
      return;
    }
    if (!hasSupabaseConfig) {
      setCoupons((current) => {
        const without = current.filter((coupon) => coupon.codigo !== payload.codigo);
        return [...without, payload].sort((a, b) => a.codigo.localeCompare(b.codigo));
      });
      setNewCoupon({ codigo: "", tipo: "porcentaje", valor: "", activo: true });
      setStatus("Cupon guardado en modo demo.");
      return;
    }
    const { error } = await supabase.from("cupones").upsert(payload);
    if (error) {
      setStatus(error.message);
      return;
    }
    const { data } = await supabase.from("cupones").select("*").order("codigo");
    setCoupons(data ?? []);
    setNewCoupon({ codigo: "", tipo: "porcentaje", valor: "", activo: true });
    await logAudit("cupon", payload.codigo, "upsert", payload);
    setStatus("Cupon guardado.");
  };

  if (!authReady || loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] text-[#252321]">
        <QuietLoader label="Abriendo backoffice" />
      </div>
    );
  }

  if (hasSupabaseConfig && !session) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] text-[#252321]">
        <PageHeader backLabel="Catalogo" title="Backoffice Nomade" />
        <main className="mx-auto max-w-md px-4 py-12 md:px-10 md:py-16">
          <p className="font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">
            Acceso admin
          </p>
          <h1 className="mt-4 font-serif text-4xl md:text-5xl">Backoffice Nomade</h1>
          <form onSubmit={signInAdmin} className="mt-8 space-y-4">
            <Field label="Email">
              <input
                name="email"
                type="email"
                value={loginForm.email}
                onChange={updateLoginForm}
                className="input"
                required
              />
            </Field>
            <Field label="Password">
              <input
                name="password"
                type="password"
                value={loginForm.password}
                onChange={updateLoginForm}
                className="input"
                required
              />
            </Field>
            <button
              type="submit"
              className="w-full border border-[#252321] px-5 py-3 font-sans text-[9pt] uppercase tracking-[0.16em] transition hover:bg-[#252321] hover:text-[#FAF9F6]"
            >
              Entrar
            </button>
          </form>
          {status && <p className="mt-6 font-serif text-lg leading-7 text-[#5F5A55]">{status}</p>}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#252321]">
      <header className="border-b border-[#CCC5BD]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 md:px-8 md:py-6 lg:px-10">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <Link to="/" className="flex items-center">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Nomade Project"
                  className="h-auto max-h-20 max-w-[64vw] object-contain md:max-h-24 md:max-w-[520px]"
                />
              ) : (
                <span className="font-serif text-4xl text-[#252321]">Nomade Project</span>
              )}
            </Link>
            <h1 className="font-serif text-3xl md:text-4xl">Backoffice Nomade</h1>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link
              to="/"
              className="inline-flex items-center gap-3 font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F] hover:text-[#252321]"
            >
              <ArrowLeft size={15} strokeWidth={1.5} />
              Catalogo
            </Link>
            <Link
              to="/admin/pedidos"
              className="inline-flex items-center gap-3 font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F] hover:text-[#252321]"
            >
              <ClipboardList size={15} strokeWidth={1.5} />
              Pedidos historicos
            </Link>
            <Link
              to="/admin/manual"
              className="inline-flex items-center gap-3 font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F] hover:text-[#252321]"
            >
              <BookOpen size={15} strokeWidth={1.5} />
              Manual de usuario
            </Link>
            {hasSupabaseConfig && (
              <button
                type="button"
                onClick={signOutAdmin}
                className="inline-flex items-center gap-3 font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F] hover:text-[#252321]"
              >
                <LogOut size={15} strokeWidth={1.5} />
                Salir
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-8 lg:px-10">
        <AdminSectionNav activeSection={activeSection} />

        {!activeSection && <AdminHome />}

        {activeSection === "finanzas" && (
          <SalesDashboard dashboard={salesDashboard} salesFrom={salesFrom} salesTo={salesTo} setSalesFrom={setSalesFrom} setSalesTo={setSalesTo} />
        )}

        {activeSection === "ventas-producto" && <SalesReport dashboard={salesDashboard} />}

        {activeSection === "categorias" && (
          <CategoryManager activeCategories={activeCategories} inactiveCategories={inactiveCategories} newCategoryName={newCategoryName} setNewCategoryName={setNewCategoryName} onAddCategory={addCategory} onRenameCategory={renameCategory} onToggleCategoryStatus={toggleCategoryStatus} />
        )}

        {activeSection === "productos" && (
          <ProductMaster activeProducts={activeProducts} inactiveProducts={inactiveProducts} selectedId={selectedId} setSelectedId={setSelectedId} selectedProduct={selectedProduct} form={form} updateForm={updateForm} activeCategories={activeCategories} saveProduct={saveProduct} productDirty={productDirty} toggleProductStatus={toggleProductStatus} createProduct={createProduct} uploadProductImage={uploadProductImage} />
        )}

        {activeSection === "branding" && (
          <BrandingSection logoUrl={logoUrl} uploadLogo={uploadLogo} brandingForm={brandingForm} updateBrandingForm={updateBrandingForm} saveBrandingForm={saveBrandingForm} brandingDirty={brandingDirty} />
        )}

        {activeSection === "regiones" && (
          <ShippingRegionsSection
            shippingForm={shippingForm}
            updateShippingRegion={updateShippingRegion}
            updateShippingNotes={updateShippingNotes}
            saveShippingForm={saveShippingForm}
            shippingDirty={shippingDirty}
          />
        )}

        {activeSection === "acerca" && (
          <AboutBrandingSection brandingForm={brandingForm} updateBrandingForm={updateBrandingForm} saveBrandingForm={saveBrandingForm} uploadAboutImage={uploadAboutImage} brandingDirty={brandingDirty} />
        )}

        {activeSection === "codigos" && (
          <div className="space-y-8">
            <CouponManager coupons={coupons} newCoupon={newCoupon} updateNewCoupon={updateNewCoupon} saveCoupon={saveCoupon} />
            <AuditLog logs={auditLogs} />
          </div>
        )}
        {status && (
          <p className="animate-fadeIn border-t border-[#CCC5BD] pt-6 font-serif text-lg leading-7 text-[#5F5A55]">
            {status}
          </p>
        )}
      </main>
    </div>
  );
}

function AdminSectionNav({ activeSection }) {
  return (
    <nav className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Secciones de administracion">
      {adminSections.map(({ id, title, eyebrow, icon: Icon }) => (
        <Link
          key={id}
          to={`/admin/${id}`}
          className={`border p-4 transition ${
            activeSection === id
              ? "border-[#252321] bg-[#252321] text-[#FAF9F6]"
              : "border-[#CCC5BD] bg-white/30 text-[#252321] hover:border-[#252321]"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={`font-sans text-[8pt] uppercase tracking-[0.16em] ${activeSection === id ? "text-[#FAF9F6]/75" : "text-[#6B655F]"}`}>
                {eyebrow}
              </p>
              <p className="mt-2 font-serif text-xl leading-tight">{title}</p>
            </div>
            <Icon size={18} strokeWidth={1.5} />
          </div>
        </Link>
      ))}
    </nav>
  );
}

function AdminHome() {
  return (
    <section className="border border-[#CCC5BD] bg-white/30 p-5 md:p-8">
      <p className="font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">Backoffice Nomade</p>
      <h2 className="mt-3 font-serif text-3xl leading-tight md:text-4xl">Selecciona un modulo para administrar</h2>
      <p className="mt-4 max-w-3xl font-serif text-lg leading-8 text-[#5F5A55]">
        El backoffice ahora esta separado por paginas para que sea mas claro en celulares y mas rapido de operar en escritorio.
      </p>
    </section>
  );
}

function ProductMaster({
  activeProducts,
  inactiveProducts,
  selectedId,
  setSelectedId,
  selectedProduct,
  form,
  updateForm,
  activeCategories,
  saveProduct,
  productDirty,
  toggleProductStatus,
  createProduct,
  uploadProductImage
}) {
  return (
    <section className="border-t border-[#CCC5BD] pt-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <SectionTitle eyebrow="Catalogo" title="Maestro de Productos" />
        <button
          type="button"
          onClick={createProduct}
          className="inline-flex items-center gap-2 border border-[#252321] px-4 py-3 font-sans text-[8pt] uppercase tracking-[0.16em] transition hover:bg-[#252321] hover:text-[#FAF9F6]"
        >
          <Plus size={13} strokeWidth={1.5} />
          Nuevo
        </button>
      </div>

      <div className="grid gap-8 xl:grid-cols-[300px_minmax(0,1fr)_320px]">
        <div>
          <div className="quiet-scrollbar max-h-[520px] space-y-5 overflow-auto pr-2">
            <ProductListSection title="Activos" products={activeProducts} selectedId={selectedId} setSelectedId={setSelectedId} />
            <ProductListSection title="Dados de baja" products={inactiveProducts} selectedId={selectedId} setSelectedId={setSelectedId} inactive />
          </div>
        </div>

        {selectedProduct ? (
          <ProductEditorForm selectedProduct={selectedProduct} form={form} updateForm={updateForm} activeCategories={activeCategories} saveProduct={saveProduct} productDirty={productDirty} toggleProductStatus={toggleProductStatus} />
        ) : (
          <div className="border border-[#CCC5BD] p-6">
            <p className="font-serif text-xl leading-8 text-[#5F5A55]">Crea un producto nuevo para habilitar el editor.</p>
          </div>
        )}

        <section className="border-t border-[#CCC5BD] pt-6 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
          <p className="font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">Medios de producto</p>
          <div className="mt-5 max-w-sm overflow-hidden bg-[#F0EEE9] xl:max-w-none">
            {selectedProduct ? (
              <img src={firstImage(selectedProduct)} alt={selectedProduct.nombre} className="aspect-[4/5] w-full object-cover" />
            ) : (
              <div className="aspect-[4/5] w-full border border-[#CCC5BD]" />
            )}
          </div>
          <label className="mt-5 flex cursor-pointer items-center justify-center gap-3 border border-[#CCC5BD] px-5 py-3 font-sans text-[9pt] uppercase tracking-[0.16em] transition hover:border-[#252321]">
            <ImageUp size={15} strokeWidth={1.5} />
            Subir imagen
            <input type="file" accept="image/*" onChange={uploadProductImage} className="hidden" />
          </label>
        </section>
      </div>
    </section>
  );
}

function ProductEditorForm({ selectedProduct, form, updateForm, activeCategories, saveProduct, productDirty, toggleProductStatus }) {
  return (
    <form onSubmit={saveProduct} className="animate-fadeIn space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Nombre"><input name="nombre" value={form.nombre} onChange={updateForm} className="input" /></Field>
        <Field label="Categoria">
          <select name="categoria_id" value={form.categoria_id} onChange={updateForm} className="input">
            {activeCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.id} / {cat.nombre}</option>
            ))}
          </select>
        </Field>
        <Field label="Precio original"><input name="precio_original" type="number" min="0" step="0.01" value={form.precio_original} onChange={updateForm} className="input" /></Field>
        <Field label="Precio oferta"><input name="precio_oferta" type="number" min="0" step="0.01" value={form.precio_oferta ?? ""} onChange={updateForm} className="input" /></Field>
        <Field label="Stock"><input name="stock_quantity" type="number" min="0" value={form.stock_quantity} onChange={updateForm} className="input" /></Field>
        <Field label="Talles"><input name="talles" value={form.talles} onChange={updateForm} placeholder="XS/S/M/L/XL" className="input" /></Field>
        <Field label="Medidas"><input name="medidas" value={form.medidas} onChange={updateForm} placeholder="XX x XX cm" className="input" /></Field>
        <Field label="URL limpia"><input name="slug" value={form.slug} onChange={updateForm} placeholder="banano-color-naranja" className="input" /></Field>
        <Field label="SKU"><input name="sku" value={form.sku} onChange={updateForm} className="input" /></Field>
        <Field label="Material"><input name="material" value={form.material} onChange={updateForm} className="input" /></Field>
        <Field label="Origen"><input name="origen" value={form.origen} onChange={updateForm} className="input" /></Field>
        <Field label="Color"><input name="color" value={form.color} onChange={updateForm} className="input" /></Field>
        <Field label="Peso"><input name="peso" value={form.peso} onChange={updateForm} placeholder="1.2 kg" className="input" /></Field>
        <Field label="Tiempo despacho"><input name="tiempo_despacho" value={form.tiempo_despacho} onChange={updateForm} placeholder="3 a 5 dias habiles" className="input" /></Field>
        <ToggleField name="es_oferta" checked={form.es_oferta} onChange={updateForm} label="Marcar como oferta" />
        <ToggleField name="es_novedad" checked={form.es_novedad} onChange={updateForm} label="Marcar como novedad" />
      </div>

      <Field label="Descripcion tecnica"><textarea name="descripcion" value={form.descripcion} onChange={updateForm} rows="7" className="input resize-none leading-7" /></Field>
      <Field label="Cuidados"><textarea name="cuidados" value={form.cuidados} onChange={updateForm} rows="4" className="input resize-none leading-7" /></Field>

      <div className="flex flex-wrap gap-3">
        <button type="submit" className={saveButtonClass(productDirty, "inline-flex items-center gap-3")}>
          <Save size={15} strokeWidth={1.5} />
          Guardar producto
        </button>
        <button
          type="button"
          onClick={toggleProductStatus}
          className={`inline-flex items-center gap-3 border px-5 py-3 font-sans text-[9pt] uppercase tracking-[0.16em] transition ${
            selectedProduct.activo === false
              ? "border-[#252321] text-[#252321] hover:bg-[#252321] hover:text-[#FAF9F6]"
              : "border-[#9A3F35] text-[#7B3028] hover:bg-[#7B3028] hover:text-[#FAF9F6]"
          }`}
        >
          <Trash2 size={15} strokeWidth={1.5} />
          {selectedProduct.activo === false ? "Reactivar producto" : "Dar de baja"}
        </button>
      </div>
    </form>
  );
}

function BrandingSection({ logoUrl, uploadLogo, brandingForm, updateBrandingForm, saveBrandingForm, brandingDirty }) {
  return (
    <section className="border-t border-[#CCC5BD] pt-8">
      <SectionTitle eyebrow="Identidad y politicas" title="Branding" />
      <div className="mt-6 grid gap-8 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div>
          <div className="flex min-h-28 items-center justify-center border border-[#CCC5BD] p-5">
            {logoUrl ? <img src={logoUrl} alt="Logo Nomade" className="h-auto max-h-32 max-w-full object-contain" /> : <span className="font-serif text-2xl">Nomade Project</span>}
          </div>
          <label className="mt-5 flex cursor-pointer items-center justify-center gap-3 border border-[#CCC5BD] px-5 py-3 font-sans text-[9pt] uppercase tracking-[0.16em] transition hover:border-[#252321]">
            <Upload size={15} strokeWidth={1.5} />
            Cambiar logo
            <input type="file" accept="image/*" onChange={uploadLogo} className="hidden" />
          </label>
        </div>
        <form onSubmit={saveBrandingForm} className="grid gap-5 md:grid-cols-2">
          <Field label="Texto contacto"><input name="contact_heading" value={brandingForm.contact_heading} onChange={updateBrandingForm} className="input" /></Field>
          <Field label="Whatsapp"><input name="contact_whatsapp" value={brandingForm.contact_whatsapp} onChange={updateBrandingForm} className="input" /></Field>
          <Field label="Mail"><input name="contact_mail" value={brandingForm.contact_mail} onChange={updateBrandingForm} className="input" /></Field>
          <Field label="Texto redes"><input name="social_heading" value={brandingForm.social_heading} onChange={updateBrandingForm} className="input" /></Field>
          <Field label="Instagram"><input name="social_instagram" value={brandingForm.social_instagram} onChange={updateBrandingForm} className="input" /></Field>
          <Field label="Facebook"><input name="social_facebook" value={brandingForm.social_facebook} onChange={updateBrandingForm} className="input" /></Field>
          <Field label="Condicion IVA">
            <select name="tax_condition" value={brandingForm.tax_condition} onChange={updateBrandingForm} className="input">
              <option value="exento">Exento / no aplica IVA</option>
              <option value="responsable_inscripto">Afecto IVA / responsable</option>
            </select>
          </Field>
          <Field label="Porcentaje IVA"><input name="tax_percent" type="number" min="0" step="0.01" value={brandingForm.tax_percent} onChange={updateBrandingForm} className="input" /></Field>
          <Field label="Banner operativo"><input name="status_banner" value={brandingForm.status_banner} onChange={updateBrandingForm} className="input" /></Field>
          <Field label="Minutos reserva stock"><input name="reservation_minutes" type="number" min="15" value={brandingForm.reservation_minutes} onChange={updateBrandingForm} className="input" /></Field>
          <Field label="Cambios y devoluciones"><textarea name="policy_returns" value={brandingForm.policy_returns} onChange={updateBrandingForm} rows="4" className="input resize-none leading-7" /></Field>
          <Field label="Despacho y retiro"><textarea name="policy_shipping" value={brandingForm.policy_shipping} onChange={updateBrandingForm} rows="4" className="input resize-none leading-7" /></Field>
          <Field label="Terminos y condiciones"><textarea name="policy_terms" value={brandingForm.policy_terms} onChange={updateBrandingForm} rows="4" className="input resize-none leading-7" /></Field>
          <Field label="Politica de privacidad"><textarea name="policy_privacy" value={brandingForm.policy_privacy} onChange={updateBrandingForm} rows="4" className="input resize-none leading-7" /></Field>
          <Field label="Preguntas frecuentes"><textarea name="policy_faq" value={brandingForm.policy_faq} onChange={updateBrandingForm} rows="4" className="input resize-none leading-7" /></Field>
          <button type="submit" className={saveButtonClass(brandingDirty, "inline-flex items-center justify-center gap-3 self-end")}>
            <Save size={15} strokeWidth={1.5} />
            Guardar branding
          </button>
        </form>
      </div>
    </section>
  );
}

function AboutBrandingSection({ brandingForm, updateBrandingForm, saveBrandingForm, uploadAboutImage, brandingDirty }) {
  return (
    <section className="border-t border-[#CCC5BD] pt-8">
      <SectionTitle eyebrow="Historia editorial" title="Acerca de Nomade" />
      <form onSubmit={saveBrandingForm} className="mt-6 grid gap-8 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div>
          <div className="overflow-hidden border border-[#CCC5BD] bg-[#F0EEE9]">
            {brandingForm.about_image ? (
              <img src={brandingForm.about_image} alt="Imagen Acerca de Nomade" className="aspect-[4/3] w-full object-cover" />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center px-6 text-center font-serif text-lg leading-7 text-[#6B655F]">Sube una imagen para la pagina Acerca de Nomade.</div>
            )}
          </div>
          <label className="mt-5 flex cursor-pointer items-center justify-center gap-3 border border-[#CCC5BD] px-5 py-3 font-sans text-[9pt] uppercase tracking-[0.16em] transition hover:border-[#252321]">
            <ImageUp size={15} strokeWidth={1.5} />
            Subir imagen acerca
            <input type="file" accept="image/*" onChange={uploadAboutImage} className="hidden" />
          </label>
        </div>
        <div className="space-y-5">
          <Field label="Titulo acerca"><input name="about_title" value={brandingForm.about_title} onChange={updateBrandingForm} className="input" /></Field>
          <Field label="Contenido acerca"><textarea name="about_content" value={brandingForm.about_content} onChange={updateBrandingForm} rows="10" className="input resize-none leading-7" /></Field>
          <button type="submit" className={saveButtonClass(brandingDirty, "inline-flex items-center justify-center gap-3")}>
            <Save size={15} strokeWidth={1.5} />
            Guardar Acerca
          </button>
        </div>
      </form>
    </section>
  );
}

function ShippingRegionsSection({ shippingForm, updateShippingRegion, updateShippingNotes, saveShippingForm, shippingDirty }) {
  return (
    <section className="border-t border-[#CCC5BD] pt-8">
      <SectionTitle eyebrow="Costos de envio" title="Maestro de Regiones" />
      <form onSubmit={saveShippingForm} className="mt-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {shippingForm.regions.map((region) => (
            <div key={region.id} className="border border-[#CCC5BD] bg-white/30 p-5">
              <p className="font-sans text-[8pt] uppercase tracking-[0.14em] text-[#6B655F]">{region.id}</p>
              <div className="mt-4 grid gap-4">
                <Field label="Region">
                  <input
                    value={region.nombre}
                    onChange={(event) => updateShippingRegion(region.id, "nombre", event.target.value)}
                    className="input"
                  />
                </Field>
                <Field label="Costo de envio">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={region.costo}
                    onChange={(event) => updateShippingRegion(region.id, "costo", event.target.value)}
                    className="input"
                  />
                </Field>
              </div>
              <p className="mt-4 font-serif text-lg text-[#5F5A55]">
                Valor actual: <span className="text-[#252321]">{formatCurrency(region.costo)}</span>
              </p>
            </div>
          ))}
        </div>

        <Field label="Observaciones internas para administradores">
          <textarea
            value={shippingForm.notes}
            onChange={updateShippingNotes}
            rows="5"
            className="input resize-none leading-7"
            placeholder="Ej: confirmar cobertura rural antes de aceptar el despacho, validar tarifas especiales por volumen, etc."
          />
        </Field>

        <button type="submit" className={saveButtonClass(shippingDirty, "inline-flex items-center justify-center gap-3")}>
          <Save size={15} strokeWidth={1.5} />
          Guardar regiones
        </button>
      </form>
    </section>
  );
}

function SectionTitle({ eyebrow, title }) {
  return (
    <div>
      <p className="font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">{eyebrow}</p>
      <h2 className="mt-3 font-serif text-3xl leading-tight md:text-4xl">{title}</h2>
    </div>
  );
}

function ToggleField({ name, checked, onChange, label }) {
  return (
    <label className="flex items-center gap-3 border border-[#CCC5BD] px-4 py-3">
      <input name={name} type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 accent-[#252321]" />
      <span className="font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">{label}</span>
    </label>
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

function filterOrdersByDateRange(orders, from, to) {
  if (!from && !to) return orders;
  const fromTime = from ? new Date(`${from}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY;
  const toTime = to ? new Date(`${to}T23:59:59`).getTime() : Number.POSITIVE_INFINITY;
  return orders.filter((order) => {
    const time = new Date(order.created_at).getTime();
    return time >= fromTime && time <= toTime;
  });
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
          body { color: #252321; font-family: Arial, sans-serif; background: #FAF9F6; }
          h1, h2 { font-family: Georgia, serif; font-weight: 400; }
          h1 { font-size: 34px; margin: 0 0 8px; }
          h2 { font-size: 22px; margin: 28px 0 12px; }
          p, th { color: #77716B; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; background: transparent; }
          th, td { border-bottom: 1px solid #CCC5BD; padding: 10px 8px; text-align: left; font-size: 12px; }
          .number { text-align: right; }
          .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-top: 26px; }
          .metric { border: 1px solid #CCC5BD; padding: 14px; }
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

function downloadSalesCsv(dashboard) {
  const rows = [
    ["Categoria", "Producto", "Unidades", "Ventas"],
    ...dashboard.productRows.map((row) => [row.categoryName, row.name, row.units, row.revenue])
  ];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "ventas-nomade.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function SalesDashboard({ dashboard, salesFrom, salesTo, setSalesFrom, setSalesTo }) {
  return (
    <section className="border-b border-[#CCC5BD] pb-8">
      <div className="mb-6 flex items-center justify-between gap-5">
        <div>
          <p className="font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">
            Dashboard de ventas
          </p>
          <h2 className="mt-3 font-serif text-3xl leading-tight md:text-4xl">Integridad financiera</h2>
        </div>
        <TrendingUp size={22} strokeWidth={1.4} className="text-[#6B655F]" />
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
        <Field label="Fecha desde">
          <input type="date" value={salesFrom} onChange={(event) => setSalesFrom(event.target.value)} className="input" />
        </Field>
        <Field label="Fecha hasta">
          <input type="date" value={salesTo} onChange={(event) => setSalesTo(event.target.value)} className="input" />
        </Field>
        <button
          type="button"
          onClick={() => {
            setSalesFrom("");
            setSalesTo("");
          }}
          className="self-end border border-[#CCC5BD] px-5 py-3 font-sans text-[9pt] uppercase tracking-[0.16em] transition hover:border-[#252321]"
        >
          Limpiar filtro
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-4">
        <Metric label="Ingresos pagados" value={formatCurrency(dashboard.revenue)} />
        <Metric label="Pedidos pagados" value={dashboard.orders} />
        <Metric label="Unidades vendidas" value={dashboard.units} />
        <Metric label="Ticket promedio" value={formatCurrency(dashboard.averageOrder)} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <p className="mb-4 font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">
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
                    <span className="font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">
                      {formatCurrency(row.revenue)} / {row.units} uds.
                    </span>
                  </div>
                  <div className="h-2 bg-[#CCC5BD]">
                    <div
                      className="h-full bg-[#252321]"
                      style={{ width: `${Math.max(row.share * 100, 4)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="border-t border-[#CCC5BD] pt-6 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <p className="font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">
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
    <section className="border-b border-[#CCC5BD] pb-8">
      <div className="mb-6 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">
            Reporte exportable
          </p>
          <h2 className="mt-3 font-serif text-3xl">Ventas por producto</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => generateSalesPdf(dashboard)}
            className="inline-flex items-center justify-center gap-3 border border-[#252321] px-5 py-3 font-sans text-[9pt] uppercase tracking-[0.16em] transition hover:bg-[#252321] hover:text-[#FAF9F6]"
          >
            <FileText size={15} strokeWidth={1.5} />
            Generar PDF
          </button>
          <button
            type="button"
            onClick={() => downloadSalesCsv(dashboard)}
            className="inline-flex items-center justify-center gap-3 border border-[#CCC5BD] px-5 py-3 font-sans text-[9pt] uppercase tracking-[0.16em] transition hover:border-[#252321]"
          >
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse">
          <thead>
            <tr className="border-b border-[#CCC5BD]">
              <th className="py-3 pr-4 text-left font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">
                Categoria
              </th>
              <th className="py-3 pr-4 text-left font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">
                Producto
              </th>
              <th className="py-3 pr-4 text-right font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">
                Unidades
              </th>
              <th className="py-3 text-right font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">
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
                <tr key={`${row.categoryName}-${row.id}`} className="border-b border-[#CCC5BD]">
                  <td className="py-4 pr-4 font-serif text-base">{row.categoryName}</td>
                  <td className="py-4 pr-4 font-serif text-base">{row.name}</td>
                  <td className="py-4 pr-4 text-right font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">
                    {row.units}
                  </td>
                  <td className="py-4 text-right font-sans text-[9pt] uppercase tracking-[0.16em] text-[#252321]">
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
          <div key={row.name} className="border border-[#CCC5BD] p-4">
            <p className="font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">
              Subtotal categoria
            </p>
            <p className="mt-3 font-serif text-2xl">{row.name}</p>
            <div className="mt-4 flex items-center justify-between gap-4 font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">
              <span>{row.units} uds.</span>
              <span className="text-[#252321]">{formatCurrency(row.revenue)}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CategoryManager({
  activeCategories,
  inactiveCategories,
  newCategoryName,
  setNewCategoryName,
  onAddCategory,
  onRenameCategory,
  onToggleCategoryStatus
}) {
  const [drafts, setDrafts] = useState({});
  const categorias = useMemo(
    () => [...activeCategories, ...inactiveCategories],
    [activeCategories, inactiveCategories]
  );

  useEffect(() => {
    setDrafts(Object.fromEntries(categorias.map((cat) => [cat.id, cat.nombre])));
  }, [categorias]);

  return (
    <section className="border-b border-[#CCC5BD] pb-8">
      <div className="mb-6">
        <p className="font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">
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
          className="border border-[#252321] px-5 py-3 font-sans text-[9pt] uppercase tracking-[0.16em] transition hover:bg-[#252321] hover:text-[#FAF9F6]"
        >
          Agregar categoria
        </button>
      </form>

      <CategoryListSection
        title="Categorias activas"
        categories={activeCategories}
        drafts={drafts}
        setDrafts={setDrafts}
        onRenameCategory={onRenameCategory}
        onToggleCategoryStatus={onToggleCategoryStatus}
      />
      <CategoryListSection
        title="Categorias dadas de baja"
        categories={inactiveCategories}
        drafts={drafts}
        setDrafts={setDrafts}
        onRenameCategory={onRenameCategory}
        onToggleCategoryStatus={onToggleCategoryStatus}
        inactive
      />
    </section>
  );
}

function CategoryListSection({
  title,
  categories,
  drafts,
  setDrafts,
  onRenameCategory,
  onToggleCategoryStatus,
  inactive = false
}) {
  return (
    <div className="mt-5">
      <p className="mb-3 font-sans text-[8pt] uppercase tracking-[0.16em] text-[#6B655F]">{title}</p>
      <div className="grid gap-3 md:grid-cols-2">
        {categories.map((cat) => (
          <div key={cat.id} className={`flex flex-wrap gap-3 border border-[#CCC5BD] p-3 ${inactive ? "bg-[#F0EEE9]" : ""}`}>
            <div className="flex h-11 w-12 shrink-0 items-center justify-center border border-[#CCC5BD] font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">
              {cat.id}
            </div>
            <input
              value={drafts[cat.id] ?? cat.nombre}
              onChange={(event) =>
                setDrafts((current) => ({ ...current, [cat.id]: event.target.value }))
              }
              className="input min-w-[180px] flex-1"
            />
            <button
              type="button"
              onClick={() => onRenameCategory(cat.id, drafts[cat.id] ?? cat.nombre)}
              className={saveButtonClass((drafts[cat.id] ?? cat.nombre) !== cat.nombre, "")}
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => onToggleCategoryStatus(cat.id)}
              className={`border px-4 font-sans text-[9pt] uppercase tracking-[0.16em] transition ${
                inactive
                  ? "border-[#252321] text-[#252321] hover:bg-[#252321] hover:text-[#FAF9F6]"
                  : "border-[#9A3F35] text-[#7B3028] hover:bg-[#7B3028] hover:text-[#FAF9F6]"
              }`}
            >
              {inactive ? "Reactivar" : "Dar de baja"}
            </button>
          </div>
        ))}
        {!categories.length && (
          <p className="border border-[#CCC5BD] p-4 font-serif text-base leading-6 text-[#5F5A55]">
            Sin categorias en esta seccion.
          </p>
        )}
      </div>
    </div>
  );
}

function CouponManager({ coupons, newCoupon, updateNewCoupon, saveCoupon }) {
  return (
    <section className="border-b border-[#CCC5BD] pb-8">
      <div className="mb-6">
        <p className="font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">
          Cupones y descuentos
        </p>
        <h2 className="mt-3 font-serif text-3xl">Codigos comerciales</h2>
      </div>
      <form onSubmit={saveCoupon} className="grid gap-3 md:grid-cols-[1fr_160px_140px_auto_auto]">
        <input name="codigo" value={newCoupon.codigo} onChange={updateNewCoupon} placeholder="NOMADE10" className="input" />
        <select name="tipo" value={newCoupon.tipo} onChange={updateNewCoupon} className="input">
          <option value="porcentaje">Porcentaje</option>
          <option value="monto">Monto fijo</option>
        </select>
        <input name="valor" type="number" min="0" value={newCoupon.valor} onChange={updateNewCoupon} placeholder="10" className="input" />
        <label className="flex items-center gap-2 border border-[#CCC5BD] px-4">
          <input name="activo" type="checkbox" checked={newCoupon.activo} onChange={updateNewCoupon} className="h-4 w-4 accent-[#252321]" />
          <span className="font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">Activo</span>
        </label>
        <button type="submit" className="border border-[#252321] px-5 py-3 font-sans text-[9pt] uppercase tracking-[0.16em] transition hover:bg-[#252321] hover:text-[#FAF9F6]">
          Guardar
        </button>
      </form>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {coupons.map((coupon) => (
          <div key={coupon.codigo} className="border border-[#CCC5BD] p-4">
            <p className="font-serif text-xl">{coupon.codigo}</p>
            <p className="mt-2 font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">
              {coupon.tipo} / {coupon.valor} / {coupon.activo ? "activo" : "inactivo"}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function AuditLog({ logs }) {
  return (
    <section className="border-b border-[#CCC5BD] pb-8">
      <p className="font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">
        Historial de cambios
      </p>
      <div className="mt-5 space-y-3">
        {logs.map((log) => (
          <div key={log.id} className="border border-[#CCC5BD] p-4">
            <p className="font-serif text-lg">
              {log.accion} / {log.entidad}
            </p>
            <p className="mt-2 font-sans text-[8pt] uppercase tracking-[0.16em] text-[#6B655F]">
              {log.actor_email || "sistema"} / {new Date(log.created_at).toLocaleString("es-CL")}
            </p>
          </div>
        ))}
        {!logs.length && (
          <p className="font-serif text-lg text-[#5F5A55]">Sin cambios auditados todavia.</p>
        )}
      </div>
    </section>
  );
}

function AuditLine({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#CCC5BD] pb-3">
      <span className="font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">{label}</span>
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

function saveButtonClass(isDirty, extra = "") {
  const state = isDirty
    ? "border-[#9A3F35] bg-[#FEE2E2] text-[#7B3028] hover:bg-[#7B3028] hover:text-[#FAF9F6]"
    : "border-[#252321] text-[#252321] hover:bg-[#252321] hover:text-[#FAF9F6]";
  return `${extra} border px-5 py-3 font-sans text-[9pt] uppercase tracking-[0.16em] transition ${state}`;
}

function Metric({ label, value }) {
  return (
    <div>
      <p className="font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">{label}</p>
      <p className="mt-3 font-serif text-3xl">{value}</p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">
        {label}
      </span>
      {children}
    </label>
  );
}

function ProductListSection({ title, products, selectedId, setSelectedId, inactive = false }) {
  return (
    <section>
      <p className="mb-2 font-sans text-[8pt] uppercase tracking-[0.16em] text-[#6B655F]">{title}</p>
      <div className="space-y-2">
        {products.map((product) => (
          <button
            key={product.id}
            type="button"
            onClick={() => setSelectedId(product.id)}
            className={`w-full border px-4 py-3 text-left transition ${
              selectedId === product.id ? "border-[#252321]" : "border-[#CCC5BD] hover:border-[#AFA79E]"
            } ${inactive ? "bg-[#F0EEE9]" : ""}`}
          >
            <span className="block font-serif text-lg">{product.nombre}</span>
            <span className="mt-1 block font-sans text-[9pt] uppercase tracking-[0.16em] text-[#6B655F]">
              {formatCurrency(effectivePrice(product))}
            </span>
            {inactive && (
              <span className="mt-2 block font-sans text-[8pt] uppercase tracking-[0.16em] text-[#9A3F35]">
                Dado de baja
              </span>
            )}
            {product.es_novedad === true && (
              <span className="mt-2 block font-sans text-[8pt] uppercase tracking-[0.16em] text-[#6B655F]">
                Novedad
              </span>
            )}
            {product.es_oferta === true && (
              <span className="mt-2 block font-sans text-[8pt] uppercase tracking-[0.16em] text-[#6B655F]">
                Oferta
              </span>
            )}
          </button>
        ))}
        {!products.length && (
          <p className="border border-[#CCC5BD] p-4 font-serif text-base leading-6 text-[#5F5A55]">
            Sin productos en esta seccion.
          </p>
        )}
      </div>
    </section>
  );
}
