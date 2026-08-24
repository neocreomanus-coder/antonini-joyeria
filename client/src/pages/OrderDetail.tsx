import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { formatOrderNumber } from "@/lib/paymentFlow";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Package, ChevronLeft, MapPin, Phone } from "lucide-react";

const STATUS_LABELS: Record<string, { label: string; color: string; step: number }> = {
  pendiente: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800", step: 0 },
  despachado: { label: "Despachado", color: "bg-amber-100 text-amber-800", step: 1 },
  entregado: { label: "Entregado", color: "bg-green-100 text-green-800", step: 2 },
};

const STATUS_STEPS = ["Pendiente", "Despachado", "Entregado"];

function formatPrice(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);
}

export default function OrderDetail() {
  const [, params] = useRoute("/mis-pedidos/:id");
  const id = parseInt(params?.id ?? "0");
  const { data: order, isLoading } = trpc.orders.getById.useQuery({ id }, { enabled: !!id });

  if (isLoading) return (
    <div className="min-h-screen flex flex-col"><Header />
      <main className="flex-1 container pt-24 pb-10 animate-pulse">
        <div className="h-8 bg-gold-100 rounded w-48 mb-6" />
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-64 bg-gold-100 rounded-2xl" />
          <div className="h-64 bg-gold-100 rounded-2xl" />
        </div>
      </main>
      <Footer />
    </div>
  );

  if (!order) return (
    <div className="min-h-screen flex flex-col"><Header />
      <main className="flex-1 container pt-24 pb-20 text-center">
        <p className="font-sans text-2xl text-[oklch(0.35_0.02_60)]">Pedido no encontrado</p>
        <Link href="/mis-pedidos"><Button className="mt-4">Mis pedidos</Button></Link>
      </main>
      <Footer />
    </div>
  );

  const s = STATUS_LABELS[order.status] ?? STATUS_LABELS.pendiente;
  const addr = order.shippingAddress as any;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-[oklch(0.98_0.005_85)] pt-20 md:pt-24">
        <div className="container py-10">
          <Link href="/mis-pedidos" className="flex items-center gap-1 text-sm text-[oklch(0.52_0.02_60)] hover:text-[oklch(0.62_0.12_75)] mb-6">
            <ChevronLeft className="w-4 h-4" /> Mis pedidos
          </Link>
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-sans text-3xl font-bold text-[oklch(0.18_0.02_60)]">Pedido {formatOrderNumber(order.orderNumber ?? order.id)}</h1>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${s.color}`}>{s.label}</span>
          </div>

          {/* Progress tracker */}
          <div className="bg-white rounded-2xl p-6 border border-gold-100 mb-6">
              <div className="flex items-center justify-between">
                {STATUS_STEPS.map((step, i) => (
                  <div key={step} className="flex-1 flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-2 ${
                      i <= s.step ? "bg-[oklch(0.62_0.12_75)] text-white" : "bg-gold-100 text-[oklch(0.52_0.02_60)]"
                    }`}>{i + 1}</div>
                    <span className={`text-xs text-center ${i <= s.step ? "text-[oklch(0.48_0.11_70)] font-medium" : "text-[oklch(0.65_0.02_60)]"}`}>{step}</span>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`absolute h-0.5 w-full mt-4 ${i < s.step ? "bg-[oklch(0.62_0.12_75)]" : "bg-gold-200"}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Items */}
            <div className="bg-white rounded-2xl p-6 border border-gold-100">
              <h2 className="font-sans text-lg font-semibold text-[oklch(0.18_0.02_60)] mb-4">Productos</h2>
              <div className="space-y-3">
                {(order.items ?? []).map((item: any) => {
                  const snap = item.productSnapshot as any;
                  return (
                    <div key={item.id} className="flex gap-3 items-center">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gold-50 shrink-0">
                        {snap?.imageUrl && <img src={snap.imageUrl} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[oklch(0.18_0.02_60)]">{snap?.name}</p>
                        {snap?.reference && <p className="text-xs font-semibold uppercase tracking-wide text-brand-green">Ref. {snap.reference}</p>}
                        {snap?.variantLabel && <p className="text-xs text-[oklch(0.52_0.02_60)]">{snap.variantLabel}</p>}
                        <p className="text-xs text-[oklch(0.52_0.02_60)]">x{item.quantity}</p>
                      </div>
                      <span className="text-sm font-semibold text-[oklch(0.48_0.11_70)]">{formatPrice(parseFloat(item.unitPrice) * item.quantity)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 space-y-2 border-t border-gold-100 pt-4">
                <div className="flex justify-between text-sm text-[oklch(0.42_0.02_60)]"><span>Subtotal</span><span>{formatPrice(parseFloat(order.subtotal))}</span></div>
                {order.popupDiscountPercent && <div className="flex justify-between text-sm font-medium text-brand-green"><span>Oferta popup · {order.popupDiscountPercent}% OFF</span><span>-{formatPrice(parseFloat(order.popupDiscountAmount ?? "0"))}</span></div>}
                {order.promoCode ? <div className="flex justify-between text-sm font-medium text-brand-green"><span>Código {order.promoCode} · {order.promoDiscountPercent}% OFF</span><span>-{formatPrice(parseFloat(order.promoDiscountAmount ?? "0"))}</span></div> : <div className="flex justify-between text-sm text-[oklch(0.52_0.02_60)]"><span>Código promocional</span><span>No utilizado</span></div>}
              </div>
              <div className="border-t border-gold-100 pt-4 mt-4 flex justify-between">
                <span className="font-medium text-[oklch(0.35_0.02_60)]">Total</span>
                <span className="font-sans font-bold text-xl text-[oklch(0.48_0.11_70)]">{formatPrice(parseFloat(order.total))}</span>
              </div>
            </div>

            {/* Shipping */}
            <div className="bg-white rounded-2xl p-6 border border-gold-100">
              <h2 className="font-sans text-lg font-semibold text-[oklch(0.18_0.02_60)] mb-4">Dirección de envío</h2>
              {addr && (
                <div className="space-y-2 text-sm text-[oklch(0.35_0.02_60)]">
                  <p className="font-semibold text-[oklch(0.18_0.02_60)]">{addr.fullName}</p>
                  <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-[oklch(0.62_0.12_75)] mt-0.5 shrink-0" /><span>{addr.address}, {addr.city}, {addr.department}</span></div>
                  <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-[oklch(0.62_0.12_75)] shrink-0" /><span>{addr.phone}</span></div>
                  {addr.notes && <p className="text-[oklch(0.52_0.02_60)] italic">{addr.notes}</p>}
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-gold-100 text-xs text-[oklch(0.52_0.02_60)]">
                Pedido realizado el {new Date(order.createdAt).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </div>
              <div className="mt-4 border-t border-gold-100 pt-4 text-sm text-[oklch(0.35_0.02_60)]">
                <p className="font-semibold">Transportadora: {order.shippingCarrier === "coordinadora" ? "Coordinadora" : "Inter Rapidísimo"}</p>
                <p className="mt-1">Guía: {order.interrapidisimoGuide ?? "Aún no asignada"}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
