import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/_core/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { ShoppingBag, Lock, Truck, Shield, Gem } from "lucide-react";
import { WOMPI_PAYMENT_BUTTON_IMAGE } from "@/lib/paymentFlow";

function fmt(n: number) {
  return `$ ${n.toLocaleString("es-CO")}`;
}

export default function Checkout() {
  const { items, subtotal, sessionId, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);
  const [payMethod, setPayMethod] = useState<"cod" | "wompi">("cod");
  const [form, setForm] = useState({
    fullName: user?.name ?? "",
    email: user?.email ?? "",
    phone: "",
    address: "",
    city: "",
    department: "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) { toast.error("Tu carrito está vacío"); return; }
    if (!form.fullName || !form.phone || !form.address || !form.city || !form.department) {
      toast.error("Completa todos los campos obligatorios"); return;
    }
    setLoading(true);
    await createOrder.mutateAsync({
      guestEmail: !isAuthenticated ? (form.email || undefined) : undefined,
      total: String(subtotal),
      subtotal: String(subtotal),
      shippingAddress: { fullName: form.fullName, address: form.address, city: form.city, department: form.department, phone: form.phone, notes: form.notes },
      paymentMethod: payMethod === "wompi" ? "wompi" : "contraentrega",
      sessionId: !isAuthenticated ? sessionId : undefined,
      items: items.map(item => ({
        productId: item.productId,
        variantId: item.variantId ?? undefined,
        quantity: item.quantity,
        unitPrice: String(parseFloat(item.productBasePrice ?? "0") + parseFloat(item.variantPriceModifier ?? "0")),
        productSnapshot: { name: item.productName ?? "", material: item.productMaterial ?? "ORO 18K", imageUrl: item.productImageUrls?.[0] ?? "", variantLabel: item.variantValue ?? undefined },
      })),
    });
  };

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

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
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-gray-500 md:mt-0 md:text-right">Piezas seleccionadas, envío gratis y acompañamiento durante tu compra.</p>
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
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-gray-600">Dirección completa *</label>
                    <input required value={form.address} onChange={f("address")} placeholder="Calle 53 # 25-33, Apto 201"
                      className="w-full rounded-none border border-black/25 bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-black" />
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-gray-600">Ciudad *</label>
                    <input required value={form.city} onChange={f("city")} placeholder="Bogotá"
                      className="w-full rounded-none border border-black/25 bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-black" />
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-gray-600">Departamento *</label>
                    <input required value={form.department} onChange={f("department")} placeholder="Cundinamarca"
                      className="w-full rounded-none border border-black/25 bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-black" />
                  </div>
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
                  ].map(({ id, icon: Icon, title, sub }) => (
                    <button key={id} type="button" onClick={() => setPayMethod(id)}
                      className={`flex items-center gap-3 border p-4 text-left transition-all ${payMethod === id ? "border-black bg-black text-white" : "border-black/20 bg-white hover:border-black"}`}>
                      {id === "wompi" ? <img src={WOMPI_PAYMENT_BUTTON_IMAGE} alt="Paga con Wompi" className="h-7 w-auto max-w-[112px] object-contain" /> : <Icon size={20} className={payMethod === id ? "text-white" : "text-gray-500"} />}
                      <div className="flex-1">
                        {id !== "wompi" && <p className={`text-sm font-bold ${payMethod === id ? "text-white" : "text-gray-800"}`}>{title}</p>}
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
                <div className="mt-5 flex items-start gap-3 border border-brand-green/20 bg-brand-green/5 p-4 text-sm text-gray-700">
                  <Truck size={20} className="mt-0.5 shrink-0 text-brand-green" />
                  <div><strong className="text-brand-green">Envíos con Interrapidísimo.</strong><p className="mt-1 text-xs leading-relaxed text-gray-600">Recibirás el número de pedido y podrás rastrear el despacho cuando asignemos la guía.</p></div>
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
                    const price = (parseFloat(item.productBasePrice ?? "0") + parseFloat(item.variantPriceModifier ?? "0")) * item.quantity;
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
                          {item.variantValue && <p className="text-xs text-gray-400">{item.variantType}: {item.variantValue}</p>}
                          <p className="text-xs text-gray-400">Cant: {item.quantity}</p>
                        </div>
                        <p className="shrink-0 text-sm font-bold text-black">{fmt(price)}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-2 border-t border-black/10 p-5">
                  <div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Envío</span><span className="font-semibold text-brand-green">Gratis</span></div>
                  <div className="flex justify-between border-t border-black pt-3 text-base font-bold text-gray-900">
                    <span>Total</span>
                    <span>{fmt(subtotal)}</span>
                  </div>
                </div>

                <div className="px-5 pb-5">
                  <button type="submit" disabled={loading || createOrder.isPending}
                    className="flex w-full items-center justify-center gap-2 bg-black py-4 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#343434] disabled:opacity-60">
                    {loading || createOrder.isPending
                      ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Procesando...</>
                      : <><Lock size={15} /> Finalizar compra · {fmt(subtotal)}</>
                    }
                  </button>
                  <div className="mt-4 flex items-center justify-center gap-4">
                    <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-gray-500"><Shield size={11} /> Compra segura</span>
                    <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-gray-500"><Truck size={11} /> Envío gratis</span>
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
