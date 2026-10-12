import { INVENTORY_ENFORCED } from "@/lib/inventorySettings";
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { ShoppingBag, Lock, Truck, Shield, Gem, Tag, Check, X } from "lucide-react";
import { WOMPI_PAYMENT_BUTTON_IMAGE } from "@/lib/paymentFlow";
import PayPalHostedButton from "@/components/PayPalHostedButton";
import { COLOMBIA_DEPARTMENTS, OTHER_CITY_VALUE, WORLD_COUNTRIES, getColombianCities, isColombia } from "@/lib/shippingAddress";

function fmt(n: number) {
  return `$ ${n.toLocaleString("es-CO")}`;
}

export default function Checkout() {
  const { items, subtotal, subtotalBeforePopupDiscount, popupDiscountAmount, popupDiscountPercent, getItemUnitPrice, sessionId, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);
  const [payMethod, setPayMethod] = useState<"cod" | "wompi" | "paypal">("cod");
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountPercent: number } | null>(null);
  const [form, setForm] = useState({
    fullName: user?.name ?? "",
    email: user?.email ?? "",
    phone: "",
    address: "",
    addressLine2: "",
    city: "",
    otherCity: "",
    department: "",
    stateProvince: "",
    postalCode: "",
    country: "Colombia",
    notes: "",
  });

  const createOrder = trpc.orders.create.useMutation({
    onSuccess: ({ orderId, paymentToken, paymentMethod }) => {
      clearCart();
      setLoading(false);
      if (paymentMethod === "wompi") {
        navigate(`/pago/wompi/${paymentToken}`);
        return;
      }
      toast.success("¡Pedido confirmado! Pronto recibirás tu joya.");
      navigate(`/pedido-confirmado/${paymentToken}?metodo=contraentrega`);
    },
    onError: (e) => { toast.error(e.message || "Error al procesar el pedido"); setLoading(false); },
  });

  const promoValidation = trpc.promoCodes.validate.useQuery(
    { code: promoInput.trim() || "__" },
    { enabled: false, retry: false },
  );
  const promoDiscountAmount = appliedPromo ? Math.round(subtotal * (appliedPromo.discountPercent / 100) * 100) / 100 : 0;
  const orderTotal = Math.max(0, Math.round((subtotal - promoDiscountAmount) * 100) / 100);
  const hasInventoryIssue = INVENTORY_ENFORCED && items.some((item) => {
    const productStock = Number(item.productStock ?? 0);
    const availableStock = item.variantId ? Math.min(productStock, Number(item.variantStock ?? 0)) : productStock;
    return item.quantity > availableStock;
  });
  const isColombianAddress = isColombia(form.country);
  const colombianCities = isColombianAddress ? getColombianCities(form.department) : [];
  const shippingSummary = isColombianAddress ? "Gratis" : "Por confirmar";

  const applyPromoCode = async () => {
    if (!promoInput.trim()) { toast.error("Escribe un código promocional"); return; }
    const result = await promoValidation.refetch();
    if (result.data?.valid) {
      setAppliedPromo({ code: result.data.code, discountPercent: result.data.discountPercent });
      setPromoInput(result.data.code);
      toast.success(`Código ${result.data.code} aplicado: ${result.data.discountPercent}% OFF`);
      return;
    }
    setAppliedPromo(null);
    toast.error("El código promocional no es válido o está inactivo");
  };

  const goToPayPalCheckout = () => {
    document.getElementById("paypal-hosted-button")?.scrollIntoView({ behavior: "smooth", block: "center" });
    toast.message("Completa el pago con el botón oficial de PayPal.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (payMethod === "paypal") {
      toast.message("Usa el botón seguro de PayPal para continuar con ese método de pago.");
      return;
    }
    if (items.length === 0) { toast.error("Tu carrito está vacío"); return; }
    if (hasInventoryIssue) { toast.error("Uno o más productos ya no tienen las existencias requeridas. Ajusta el carrito antes de continuar."); return; }
    const city = isColombianAddress && form.city === OTHER_CITY_VALUE ? form.otherCity.trim() : form.city.trim();
    const region = isColombianAddress ? form.department : form.stateProvince.trim();
    if (!form.fullName.trim() || !form.phone.trim() || !form.address.trim() || !form.country || !city || !region || (!isColombianAddress && !form.postalCode.trim())) {
      toast.error("Completa todos los campos obligatorios"); return;
    }
    setLoading(true);
    await createOrder.mutateAsync({
      guestEmail: !isAuthenticated ? (form.email || undefined) : undefined,
      total: String(orderTotal),
      subtotal: String(subtotal),
      promoCode: appliedPromo?.code,
      shippingAddress: {
        fullName: form.fullName.trim(),
        address: form.address.trim(),
        addressLine2: form.addressLine2.trim() || undefined,
        city,
        department: region,
        stateProvince: isColombianAddress ? undefined : region,
        postalCode: form.postalCode.trim() || undefined,
        country: form.country,
        phone: form.phone.trim(),
        notes: form.notes.trim() || undefined,
      },
      paymentMethod: payMethod === "wompi" ? "wompi" : "contraentrega",
      sessionId: !isAuthenticated ? sessionId : undefined,
      items: items.map(item => ({
        productId: item.productId,
        variantId: item.variantId ?? undefined,
        quantity: item.quantity,
        unitPrice: String(getItemUnitPrice(item)),
        productSnapshot: { name: item.productName ?? "", material: item.productMaterial ?? "ORO 18K", imageUrl: item.productImageUrls?.[0] ?? "", reference: item.productReference ?? undefined, variantLabel: item.variantValue ?? undefined },
      })),
    });
  };

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const selectCountry = (country: string) => setForm((current) => ({
    ...current,
    country,
    department: "",
    city: "",
    otherCity: "",
    stateProvince: "",
    postalCode: "",
  }));

  const selectDepartment = (department: string) => setForm((current) => ({
    ...current,
    department,
    city: "",
    otherCity: "",
  }));

  if (items.length === 0) return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="container py-24 text-center">
        <ShoppingBag size={56} className="mx-auto text-gray-200 mb-4" />
        <h2 className="text-2xl font-sans font-semibold text-gray-700 mb-2">Tu carrito está vacío</h2>
        <p className="text-gray-500 mb-6">Agrega productos antes de continuar.</p>
        <a href="/catalogo" className="inline-flex items-center gap-2 bg-brand-green text-white px-6 py-3 rounded-full font-semibold text-sm hover:bg-brand-green-light transition-colors">
          Explorar Catálogo
        </a>
      </div>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      <Header />

      {/* Breadcrumb */}
      <div className="border-b border-black/10 bg-white pt-20 md:pt-24">
        <div className="container py-4 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500 md:text-xs">
          <nav aria-label="Ruta de navegación" className="inline-flex items-baseline gap-2 whitespace-nowrap">
            <a href="/" className="transition-colors hover:text-black">Inicio</a>
            <span aria-hidden="true" className="text-gray-300">/</span>
            <a href="/catalogo" className="transition-colors hover:text-black">Catálogo</a>
            <span aria-hidden="true" className="text-gray-300">/</span>
            <span className="font-bold text-black">Compra segura</span>
          </nav>
        </div>
      </div>

      <div className="container max-w-6xl py-9 md:py-14">
        <div className="mb-9 border-b border-black pb-5 md:flex md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-green">Antonini Joyería</p>
            <h1 className="font-sans text-3xl font-medium tracking-[-0.035em] text-black md:text-4xl">Finaliza tu compra</h1>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-gray-500 md:mt-0 md:text-right">Piezas seleccionadas, dirección clara y acompañamiento durante tu compra.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14">

            {/* ── FORM ── */}
            <div className="space-y-10">

              {/* Step 1: Contact */}
              <section className="border-t border-black bg-white px-5 py-6 sm:px-7">
                <h2 className="mb-6 flex items-center gap-3 font-sans text-sm font-bold uppercase tracking-[0.12em] text-black">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center border border-black text-[10px]">01</span>
                  Información de contacto
                </h2>
                {!isAuthenticated && (
                  <div className="mb-6 flex items-center justify-between gap-3 border-y border-black/10 bg-[#fbfbfa] px-3 py-3">
                    <p className="text-sm text-gray-600">¿Ya tienes cuenta? Inicia sesión para rastrear tu pedido.</p>
                    <button type="button" onClick={() => startLogin()} className="whitespace-nowrap text-xs font-bold uppercase tracking-[0.1em] text-black underline underline-offset-4">Iniciar sesión</button>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-gray-600">Nombre completo *</label>
                    <input required value={form.fullName} onChange={f("fullName")} placeholder="Ej: María García"
                      className="w-full rounded-none border border-black/25 bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-black" />
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-gray-600">Correo electrónico</label>
                    <input type="email" value={form.email} onChange={f("email")} placeholder="tu@correo.com"
                      className="w-full rounded-none border border-black/25 bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-black" />
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-gray-600">Teléfono / WhatsApp *</label>
                    <input required value={form.phone} onChange={f("phone")} placeholder="3001234567"
                      className="w-full rounded-none border border-black/25 bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-black" />
                  </div>
                </div>
              </section>

              {/* Step 2: Shipping */}
              <section className="border-t border-black bg-white px-5 py-6 sm:px-7">
                <h2 className="mb-6 flex items-center gap-3 font-sans text-sm font-bold uppercase tracking-[0.12em] text-black">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center border border-black text-[10px]">02</span>
                  Dirección de envío
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-gray-600">País / territorio *</label>
                    <select required value={form.country} onChange={(event) => selectCountry(event.target.value)} className="w-full rounded-none border border-black/25 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-black">
                      {WORLD_COUNTRIES.map((country) => <option key={country} value={country}>{country}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-gray-600">Dirección completa *</label>
                    <input required value={form.address} onChange={f("address")} placeholder="Calle 53 # 25-33, Apto 201"
                      className="w-full rounded-none border border-black/25 bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-black" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-gray-600">Complemento de dirección</label>
                    <input value={form.addressLine2} onChange={f("addressLine2")} placeholder="Apartamento, piso, torre, edificio o referencia"
                      className="w-full rounded-none border border-black/25 bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-black" />
                  </div>
                  {isColombianAddress ? <>
                    <div>
                      <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-gray-600">Departamento *</label>
                      <select required value={form.department} onChange={(event) => selectDepartment(event.target.value)} className="w-full rounded-none border border-black/25 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-black">
                        <option value="" disabled>Selecciona un departamento</option>
                        {COLOMBIA_DEPARTMENTS.map((department) => <option key={department} value={department}>{department}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-gray-600">Ciudad / municipio *</label>
                      <select required disabled={!form.department} value={form.city} onChange={f("city")} className="w-full rounded-none border border-black/25 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-black disabled:cursor-not-allowed disabled:bg-gray-100">
                        <option value="" disabled>{form.department ? "Selecciona una ciudad" : "Primero selecciona departamento"}</option>
                        {colombianCities.map((city) => <option key={city} value={city}>{city}</option>)}
                        {form.department && <option value={OTHER_CITY_VALUE}>Otra ciudad / municipio</option>}
                      </select>
                    </div>
                    {form.city === OTHER_CITY_VALUE && <div className="md:col-span-2">
                      <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-gray-600">Escribe tu ciudad o municipio *</label>
                      <input required value={form.otherCity} onChange={f("otherCity")} placeholder="Ej: La Ceja"
                        className="w-full rounded-none border border-black/25 bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-black" />
                    </div>}
                  </> : <>
                    <div>
                      <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-gray-600">Ciudad *</label>
                      <input required value={form.city} onChange={f("city")} placeholder="Ciudad de destino"
                        className="w-full rounded-none border border-black/25 bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-black" />
                    </div>
                    <div>
                      <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-gray-600">Estado / provincia / región *</label>
                      <input required value={form.stateProvince} onChange={f("stateProvince")} placeholder="Estado, provincia o región"
                        className="w-full rounded-none border border-black/25 bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-black" />
                    </div>
                    <div>
                      <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-gray-600">Código postal *</label>
                      <input required value={form.postalCode} onChange={f("postalCode")} placeholder="Código postal"
                        className="w-full rounded-none border border-black/25 bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-black" />
                    </div>
                  </>}
                  {!isColombianAddress && <div className="md:col-span-2 border border-brand-green/20 bg-brand-green/5 p-3 text-xs leading-relaxed text-gray-600">
                    Para envíos internacionales, confirmaremos la cobertura y el valor de transporte antes del despacho. DHL puede estar disponible según el destino.
                  </div>}
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-gray-600">Notas adicionales</label>
                    <textarea value={form.notes} onChange={f("notes")} rows={2} placeholder="Instrucciones especiales para la entrega..."
                      className="w-full resize-none rounded-none border border-black/25 bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-black" />
                  </div>
                </div>
              </section>

              {/* Step 3: Payment */}
              <section className="border-t border-black bg-white px-5 py-6 sm:px-7">
                <h2 className="mb-6 flex items-center gap-3 font-sans text-sm font-bold uppercase tracking-[0.12em] text-black">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center border border-black text-[10px]">03</span>
                  Método de pago
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { id: "cod" as const, icon: Truck, title: "Pago contra entrega", sub: "Pagas cuando recibes tu joya" },
                    { id: "wompi" as const, icon: Lock, title: "Wompi", sub: "Pago seguro con tarjeta, PSE o transferencia" },
                    { id: "paypal" as const, icon: Shield, title: "PayPal", sub: "Pago seguro mediante PayPal" },
                  ].map(({ id, icon: Icon, title, sub }) => (
                    <button key={id} type="button" onClick={() => setPayMethod(id)}
                      className={`flex items-center gap-3 border p-4 text-left transition-all ${payMethod === id ? "border-black bg-black text-white" : "border-black/20 bg-white hover:border-black"}`}>
                      {id === "wompi" ? <img src={WOMPI_PAYMENT_BUTTON_IMAGE} alt="Paga con Wompi" className="h-11 w-auto max-w-[160px] object-contain" /> : id === "paypal" ? <span aria-label="PayPal" className="text-xl font-black tracking-[-0.08em]"><span className="text-[#003087]">Pay</span><span className="text-[#009cde]">Pal</span></span> : <Icon size={20} className={payMethod === id ? "text-white" : "text-gray-500"} />}
                      <div className="flex-1">
                        {id !== "wompi" && id !== "paypal" && <p className={`text-sm font-bold ${payMethod === id ? "text-white" : "text-gray-800"}`}>{title}</p>}
                        <p className={`text-xs ${payMethod === id ? "text-white/75" : "text-gray-500"}`}>{sub}</p>
                      </div>
                      <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${payMethod === id ? "border-white bg-white" : "border-gray-300"}`}>
                        {payMethod === id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  ))}
                </div>
                {payMethod === "wompi" && (
                  <div className="mt-4 border border-[#c9a84c]/40 bg-[#fff9e7] p-3 text-xs text-[#755512]">
                    Al finalizar tu compra se abrirá una página con 10 minutos para pagar, confirmar el pago y enviar el comprobante por WhatsApp.
                  </div>
                )}
                {payMethod === "paypal" && <PayPalHostedButton />}
                <div className="mt-5 flex items-start gap-3 border border-brand-green/20 bg-brand-green/5 p-4 text-sm text-gray-700">
                  <Truck size={20} className="mt-0.5 shrink-0 text-brand-green" />
                  <div><strong className="text-brand-green">Envíos en Colombia y al exterior con Coordinadora, Inter Rapidísimo o DHL.</strong><p className="mt-1 text-xs leading-relaxed text-gray-600">Asignaremos la transportadora y la guía al despachar tu pedido; podrás consultarlas con tu número de pedido.</p></div>
                </div>
              </section>
            </div>

            {/* ── ORDER SUMMARY ── */}
            <div>
              <aside className="sticky top-24 border border-black bg-white">
                <div className="border-b border-black p-5">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500">Tu selección</p>
                  <h2 className="font-sans text-xl font-medium tracking-[-0.025em] text-black">Resumen del pedido</h2>
                  <p className="mt-1 text-xs text-gray-400">{items.length} {items.length === 1 ? "producto" : "productos"}</p>
                </div>

                <div className="max-h-64 space-y-4 overflow-y-auto p-5">
                  {items.map(item => {
                    const price = getItemUnitPrice(item) * item.quantity;
                    return (
                      <div key={item.id} className="flex gap-3">
                        <div className="h-14 w-14 shrink-0 overflow-hidden border border-black/10 bg-gray-50">
                          {item.productImageUrls?.[0]
                            ? <img src={item.productImageUrls[0]} alt={item.productName ?? ""} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><Gem size={16} className="text-gray-300" /></div>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="line-clamp-1 text-sm font-semibold text-gray-800">{item.productName}</p>
                          {item.productReference && <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Ref. {item.productReference}</p>}
                          {item.variantValue && <p className="text-xs text-gray-400">{item.variantType}: {item.variantValue}</p>}
                          <p className="text-xs text-gray-400">Cant: {item.quantity}</p>
                        </div>
                        <p className="shrink-0 text-sm font-bold text-black">{fmt(price)}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-black/10 p-5">
                  <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500"><Tag size={13} className="text-brand-gold" /> Código promocional</p>
                  <div className="flex gap-2">
                    <input value={promoInput} onChange={(e) => { setPromoInput(e.target.value.toUpperCase().replace(/\s+/g, "")); setAppliedPromo(null); }} placeholder="EJ: ANTONINI10" className="min-w-0 flex-1 rounded-none border border-black/25 px-3 py-2.5 font-mono text-xs font-bold uppercase outline-none focus:border-black" />
                    <button type="button" onClick={applyPromoCode} disabled={promoValidation.isFetching} className="shrink-0 border border-black bg-black px-3 text-[10px] font-bold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#343434] disabled:opacity-60">{promoValidation.isFetching ? "…" : "Aplicar"}</button>
                  </div>
                  {appliedPromo && (
                    <div className="mt-3 flex items-center justify-between gap-2 border border-brand-green/20 bg-brand-green/5 px-3 py-2 text-xs text-brand-green">
                      <span className="flex min-w-0 items-center gap-1.5 font-bold"><Check size={14} /> <span className="truncate">{appliedPromo.code} · {appliedPromo.discountPercent}% OFF</span></span>
                      <button type="button" onClick={() => { setAppliedPromo(null); setPromoInput(""); }} className="shrink-0 p-0.5" aria-label="Quitar código promocional"><X size={14} /></button>
                    </div>
                  )}
                </div>

                <div className="space-y-2 border-t border-black/10 p-5">
                  <div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span>{fmt(subtotalBeforePopupDiscount)}</span></div>
                  {popupDiscountAmount > 0 && <div className="flex justify-between text-sm text-brand-green"><span>Oferta popup{popupDiscountPercent ? ` · ${popupDiscountPercent}%` : ""}</span><span>-{fmt(popupDiscountAmount)}</span></div>}
                  {appliedPromo && <div className="flex justify-between text-sm text-brand-green"><span>Descuento · {appliedPromo.code}</span><span>-{fmt(promoDiscountAmount)}</span></div>}
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Envío</span><span className={`font-semibold ${isColombianAddress ? "text-brand-green" : "text-gray-700"}`}>{shippingSummary}</span></div>
                  <div className="flex justify-between border-t border-black pt-3 text-base font-bold text-gray-900">
                    <span>Total</span>
                    <span>{fmt(orderTotal)}</span>
                  </div>
                </div>

                <div className="px-5 pb-5">
                  {hasInventoryIssue && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium leading-snug text-red-600">Hay productos sin existencias suficientes. Ajusta la cantidad en tu carrito para continuar.</p>}
                  <button type={payMethod === "paypal" ? "button" : "submit"} onClick={payMethod === "paypal" ? goToPayPalCheckout : undefined} disabled={loading || createOrder.isPending || hasInventoryIssue}
                    className="flex w-full items-center justify-center gap-2 bg-black py-4 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#343434] disabled:opacity-60">
                    {loading || createOrder.isPending
                      ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Procesando...</>
                      : hasInventoryIssue
                        ? <><Lock size={15} /> Ajusta el inventario del carrito</>
                        : payMethod === "paypal"
                          ? <><Lock size={15} /> Finalizar pago</>
                        : <><Lock size={15} /> Finalizar compra · {fmt(orderTotal)}</>
                    }
                  </button>
                  <div className="mt-4 flex items-center justify-center gap-4">
                    <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-gray-500"><Shield size={11} /> Compra segura</span>
                    <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-gray-500"><Truck size={11} /> {isColombianAddress ? "Envío gratis Colombia" : "Costo por confirmar"}</span>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
}
