import { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { CheckCircle2, Clock3, ExternalLink, MessageCircle, ShieldCheck } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { PAYMENT_RESERVATION_MS, WOMPI_PAYMENT_URL, formatOrderNumber } from "@/lib/paymentFlow";

function formatPrice(value: string | number) {
  return `$ ${Number(value).toLocaleString("es-CO")}`;
}

function getDeadline(orderId: string) {
  const key = `antonini-wompi-deadline-${orderId}`;
  const saved = Number(window.sessionStorage.getItem(key));
  if (saved > Date.now()) return saved;
  const deadline = Date.now() + PAYMENT_RESERVATION_MS;
  window.sessionStorage.setItem(key, String(deadline));
  return deadline;
}

export default function WompiPaymentInstructions() {
  const [, params] = useRoute("/pago/wompi/:token");
  const [, navigate] = useLocation();
  const paymentToken = params?.token ?? "";
  const { data: order, isLoading, error } = trpc.orders.paymentInfo.useQuery({ token: paymentToken }, { enabled: paymentToken.length >= 24 });
  const [secondsLeft, setSecondsLeft] = useState(PAYMENT_RESERVATION_MS / 1000);
  const confirmReceipt = trpc.orders.confirmWompiReceipt.useMutation({
    onSuccess: () => navigate(`/pedido-confirmado/${paymentToken}?metodo=wompi`),
  });

  useEffect(() => {
    if (!paymentToken) return;
    const deadline = getDeadline(paymentToken);
    const updateCountdown = () => setSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    updateCountdown();
    const interval = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(interval);
  }, [paymentToken]);

  const clock = useMemo(() => {
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }, [secondsLeft]);

  const expired = secondsLeft <= 0;

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      <Header />
      <main className="container max-w-3xl pt-28 pb-14 md:pt-36 md:pb-20">
        <div className="border border-black bg-white">
          <div className="border-b border-black bg-black px-6 py-5 text-white sm:px-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/65">Pago seguro con Wompi</p>
            <h1 className="mt-2 text-2xl font-medium tracking-[-0.03em] sm:text-3xl">Completa tu pago</h1>
          </div>

          {isLoading ? (
            <div className="p-10 text-center text-sm text-gray-500">Preparando las instrucciones de pago...</div>
          ) : error || !order ? (
            <div className="p-10 text-center">
              <p className="text-lg font-semibold text-black">No encontramos este pedido.</p>
              <a href="/" className="mt-4 inline-block text-sm font-bold underline underline-offset-4">Volver a la tienda</a>
            </div>
          ) : (
            <div className="p-6 sm:p-10">
              <div className={`mb-8 flex items-center justify-between border px-4 py-4 ${expired ? "border-red-300 bg-red-50 text-red-800" : "border-[#c9a84c] bg-[#fffaf0] text-[#5f4813]"}`}>
                <div className="flex items-center gap-3">
                  <Clock3 size={22} />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em]">Reserva de pago</p>
                    <p className="text-sm">{expired ? "El tiempo de reserva finalizó." : "Completa el proceso dentro de este tiempo."}</p>
                  </div>
                </div>
                <span className="font-mono text-2xl font-bold tracking-tight">{clock}</span>
              </div>

              <div className="mb-8 grid grid-cols-1 gap-4 border-y border-black/15 py-5 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">Número de pedido</p>
                  <p className="mt-1 text-lg font-bold text-black">{formatOrderNumber(order.orderNumber ?? order.id)}</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">Valor a pagar</p>
                  <p className="mt-1 text-lg font-bold text-black">{formatPrice(order.total)}</p>
                </div>
              </div>

              <ol className="space-y-5 text-sm leading-relaxed text-gray-700">
                <li className="flex gap-4"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black text-xs font-bold text-white">1</span><span>Abre la pasarela de Wompi y realiza el pago por el valor exacto indicado.</span></li>
                <li className="flex gap-4"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black text-xs font-bold text-white">2</span><span>Toma una captura de pantalla del comprobante de pago.</span></li>
                <li className="flex gap-4"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black text-xs font-bold text-white">3</span><span>Regresa aquí, confirma que realizaste el pago y envía la captura por WhatsApp para despacho inmediato.</span></li>
              </ol>

              <a href={WOMPI_PAYMENT_URL} target="_blank" rel="noreferrer" className={`mt-9 flex w-full items-center justify-center gap-2 py-4 text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors ${expired ? "pointer-events-none bg-gray-400" : "bg-black hover:bg-[#343434]"}`}>
                <ExternalLink size={16} /> Abrir pasarela Wompi
              </a>

              <button type="button" disabled={expired || confirmReceipt.isPending} onClick={() => confirmReceipt.mutate({ token: paymentToken })} className="mt-3 flex w-full items-center justify-center gap-2 border border-[#20bf63] bg-[#25D366] py-4 text-xs font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#1ebe5d] disabled:cursor-not-allowed disabled:opacity-60">
                <MessageCircle size={17} /> {confirmReceipt.isPending ? "Confirmando..." : "Ya realicé el pago"}
              </button>
              <div className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-gray-500"><ShieldCheck size={14} className="text-brand-green" /> Tu pedido quedará pendiente de validación hasta recibir el comprobante.</div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
