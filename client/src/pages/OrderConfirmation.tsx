import { useRoute } from "wouter";
import { CheckCircle2, MessageCircle, PackageCheck } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { buildPaymentProofWhatsAppUrl, formatOrderNumber } from "@/lib/paymentFlow";

function formatPrice(value: string | number) {
  return `$ ${Number(value).toLocaleString("es-CO")}`;
}

export default function OrderConfirmation() {
  const [, params] = useRoute("/pedido-confirmado/:token");
  const paymentToken = params?.token ?? "";
  const { data: order, isLoading } = trpc.orders.paymentInfo.useQuery({ token: paymentToken }, { enabled: paymentToken.length >= 24 });
  const isWompi = order?.paymentMethod === "wompi";

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      <Header />
      <main className="container max-w-2xl pt-28 pb-14 md:pt-36 md:pb-20">
        <section className="border border-black bg-white px-6 py-10 text-center sm:px-12">
          {isWompi ? <CheckCircle2 className="mx-auto h-12 w-12 text-brand-green" /> : <PackageCheck className="mx-auto h-12 w-12 text-brand-green" />}
          <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-green">{isWompi ? "Comprobante pendiente" : "Pedido recibido"}</p>
          <h1 className="mt-3 text-3xl font-medium tracking-[-0.035em] text-black">{isWompi ? "Envía tu comprobante para despacho" : "Tu pedido está confirmado"}</h1>
          {isLoading || !order ? <p className="mt-5 text-sm text-gray-500">Preparando la confirmación del pedido...</p> : <>
            <div className="mx-auto mt-7 max-w-sm border-y border-black/15 py-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">Número de pedido</p>
              <p className="mt-1 text-2xl font-bold text-black">{formatOrderNumber(order.id)}</p>
              <p className="mt-3 text-sm text-gray-600">Total: <span className="font-bold text-black">{formatPrice(order.total)}</span></p>
            </div>
            {isWompi ? <>
              <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-gray-600">Abre WhatsApp, adjunta la captura del pago y envíala. Nuestro equipo validará tu comprobante para despachar tu joya inmediatamente.</p>
              <a href={buildPaymentProofWhatsAppUrl({ orderId: order.id, total: order.total })} target="_blank" rel="noreferrer" className="mt-7 inline-flex w-full items-center justify-center gap-2 bg-[#25D366] px-5 py-4 text-xs font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#1ebe5d]">
                <MessageCircle size={17} /> Enviar comprobante por WhatsApp
              </a>
            </> : <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-gray-600">Pago contraentrega seleccionado. Te contactaremos para confirmar el despacho y la entrega de tu joya.</p>}
          </>}
          <a href="/" className="mt-6 inline-block text-xs font-bold uppercase tracking-[0.12em] text-black underline underline-offset-4">Volver a la tienda</a>
        </section>
      </main>
      <Footer />
    </div>
  );
}
