import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { PackageSearch, Truck, CheckCircle2, Clock3 } from "lucide-react";

const STATUS = {
  pendiente: { label: "Pendiente", description: "Estamos preparando tu pedido.", icon: Clock3 },
  despachado: { label: "Despachado", description: "Tu pedido está en camino con Interrapidísimo.", icon: Truck },
  entregado: { label: "Entregado", description: "Tu pedido fue entregado.", icon: CheckCircle2 },
} as const;

export default function TrackOrder() {
  const [value, setValue] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const tracking = trpc.orders.track.useQuery({ orderNumber }, { enabled: Boolean(orderNumber), retry: false });
  const carrierName = tracking.data?.shippingCarrier === "coordinadora" ? "Coordinadora" : "Inter Rapidísimo";
  const detail = tracking.data
    ? {
      ...STATUS[tracking.data.status],
      description: tracking.data.status === "despachado" ? `Tu pedido está en camino con ${carrierName}.` : STATUS[tracking.data.status].description,
    }
    : null;
  const Icon = detail?.icon ?? PackageSearch;

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      <Header />
      <main className="container max-w-3xl pt-28 pb-16 md:pt-36">
        <div className="border-t border-black bg-white px-5 py-8 sm:px-10 sm:py-12">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-green">Antonini Joyería</p>
          <h1 className="mt-3 text-3xl font-medium tracking-[-0.035em] text-black md:text-4xl">Rastrea tu pedido</h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-gray-600">Ingresa el número que recibiste al confirmar tu compra, por ejemplo <strong>ANT-000123</strong>.</p>
          <form className="mt-7 flex flex-col gap-3 sm:flex-row" onSubmit={(event) => { event.preventDefault(); setOrderNumber(value.trim().toUpperCase()); }}>
            <input value={value} onChange={(event) => setValue(event.target.value)} placeholder="ANT-000123" className="min-w-0 flex-1 border border-black/25 px-4 py-3 text-sm uppercase outline-none focus:border-black" required />
            <button type="submit" className="bg-black px-6 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-[#343434]">Rastrear</button>
          </form>

          {tracking.isError && <p className="mt-5 border border-red-200 bg-red-50 p-3 text-sm text-red-700">No encontramos un pedido con ese número. Revisa el formato e inténtalo de nuevo.</p>}
          {tracking.isLoading && <p className="mt-5 text-sm text-gray-500">Consultando el estado de tu pedido…</p>}
          {tracking.data && detail && (
            <div className="mt-7 border border-black/15 p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-green/10 text-brand-green"><Icon size={22} /></div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">{tracking.data.orderNumber}</p>
                  <h2 className="mt-1 text-xl font-semibold text-black">{detail.label}</h2>
                  <p className="mt-1 text-sm text-gray-600">{detail.description}</p>
                </div>
              </div>
              <div className="mt-5 border-t border-black/10 pt-4 text-sm text-gray-700">
                <p><strong>Transportadora:</strong> {carrierName}</p>
                <p className="mt-1"><strong>Guía:</strong> {tracking.data.interrapidisimoGuide ?? "Aún no asignada"}</p>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
