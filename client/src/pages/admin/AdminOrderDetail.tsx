import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { formatOrderNumber } from "@/lib/paymentFlow";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChevronLeft, MapPin, Phone, User } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "pendiente", label: "Pendiente" },
  { value: "despachado", label: "Despachado" },
  { value: "entregado", label: "Entregado" },
] as const;

const STATUS_COLORS: Record<string, string> = {
  pendiente: "bg-green-100 text-green-800",
  despachado: "bg-amber-100 text-amber-800",
  entregado: "bg-green-100 text-green-800",
};

function formatPrice(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);
}

export default function AdminOrderDetail() {
  const [, params] = useRoute("/admin/pedidos/:orderNumber");
  const orderNumber = params?.orderNumber?.toUpperCase() ?? "";
  const utils = trpc.useUtils();
  const { data: order, isLoading } = trpc.orders.adminGetByOrderNumber.useQuery({ orderNumber }, { enabled: /^ANT-\d{6,}$/.test(orderNumber) });
  const updateShipment = trpc.orders.updateShipment.useMutation({
    onSuccess: () => { toast.success("Despacho actualizado"); utils.orders.adminGetByOrderNumber.invalidate({ orderNumber }); utils.orders.adminList.invalidate(); },
    onError: e => toast.error(e.message),
  });

  if (isLoading) return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gold-100 rounded w-48" />
      <div className="grid md:grid-cols-2 gap-4">
        <div className="h-64 bg-gold-100 rounded-2xl" />
        <div className="h-64 bg-gold-100 rounded-2xl" />
      </div>
    </div>
  );

  if (!order) return (
    <div className="text-center py-20">
      <p className="font-sans text-xl text-[oklch(0.35_0.02_60)]">Pedido no encontrado</p>
      <Link href="/admin/pedidos"><Button className="mt-4">Volver</Button></Link>
    </div>
  );

  const addr = order.shippingAddress as any;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
      <Link href="/admin/pedidos" className="flex items-center gap-1 text-sm text-[oklch(0.52_0.02_60)] hover:text-[oklch(0.62_0.12_75)] mb-6">
        <ChevronLeft className="w-4 h-4" /> Todos los pedidos
      </Link>

      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-sans text-2xl font-bold text-[oklch(0.18_0.02_60)]">Pedido {formatOrderNumber(order.orderNumber ?? order.id)}</h1>
          <p className="text-sm text-[oklch(0.52_0.02_60)]">{new Date(order.createdAt).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${STATUS_COLORS[order.status] ?? ""}`}>
            {STATUS_OPTIONS.find(s => s.value === order.status)?.label}
          </span>
          <div className="grid w-full grid-cols-3 gap-2 sm:w-auto">
            {STATUS_OPTIONS.map(option => (
              <button
                key={option.value}
                type="button"
                disabled={updateShipment.isPending}
                onClick={() => updateShipment.mutate({ id: order.id, status: option.value, shippingCarrier: order.shippingCarrier ?? "interrapidisimo", interrapidisimoGuide: order.interrapidisimoGuide })}
                className={`min-h-10 px-2 text-[11px] font-bold transition-colors ${order.status === option.value ? "bg-brand-green text-white" : "border border-gray-200 bg-white text-gray-600 hover:border-brand-green"}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Products */}
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
                    <p className="text-xs text-[oklch(0.52_0.02_60)]">{snap?.material}{snap?.variantLabel ? ` · ${snap.variantLabel}` : ""} · x{item.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold text-[oklch(0.48_0.11_70)] shrink-0">{formatPrice(parseFloat(item.unitPrice) * item.quantity)}</span>
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

        {/* Customer & Shipping */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-gold-100">
            <h2 className="font-sans text-lg font-semibold text-[oklch(0.18_0.02_60)] mb-4 flex items-center gap-2"><User className="w-4 h-4 text-[oklch(0.62_0.12_75)]" /> Cliente</h2>
            <p className="text-sm text-[oklch(0.35_0.02_60)]">{addr?.fullName ?? "—"}</p>
            <p className="text-sm text-[oklch(0.52_0.02_60)]">{order.guestEmail ?? "Usuario registrado"}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gold-100">
            <h2 className="font-sans text-lg font-semibold text-[oklch(0.18_0.02_60)] mb-4 flex items-center gap-2"><MapPin className="w-4 h-4 text-[oklch(0.62_0.12_75)]" /> Dirección de envío</h2>
            {addr && (
              <div className="space-y-1 text-sm text-[oklch(0.35_0.02_60)]">
                <p>{addr.address}</p>
                <p>{addr.city}, {addr.department}</p>
                <div className="flex items-center gap-1 mt-2"><Phone className="w-3 h-3 text-[oklch(0.62_0.12_75)]" /><span>{addr.phone}</span></div>
                {addr.notes && <p className="text-[oklch(0.52_0.02_60)] italic mt-1">{addr.notes}</p>}
              </div>
            )}
            <form
              className="mt-4 border-t border-gold-100 pt-4"
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                const guide = String(formData.get("guide") ?? "");
                const shippingCarrier = String(formData.get("shippingCarrier") ?? "interrapidisimo") === "coordinadora" ? "coordinadora" : "interrapidisimo";
                updateShipment.mutate({ id: order.id, status: order.status, shippingCarrier, interrapidisimoGuide: guide || null });
              }}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[oklch(0.52_0.02_60)]">Transportadora y guía</p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <select name="shippingCarrier" defaultValue={order.shippingCarrier ?? "interrapidisimo"} className="border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-green">
                  <option value="interrapidisimo">Inter Rapidísimo</option>
                  <option value="coordinadora">Coordinadora</option>
                </select>
                <input name="guide" defaultValue={order.interrapidisimoGuide ?? ""} placeholder="Ingresa la guía" className="min-w-0 flex-1 border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-green" />
                <Button type="submit" disabled={updateShipment.isPending} className="shrink-0 bg-brand-green px-3 text-xs text-white hover:bg-brand-green">Guardar</Button>
              </div>
              <p className="mt-2 text-xs text-gray-500">La transportadora y la guía quedarán visibles para el cliente al rastrear el pedido.</p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
