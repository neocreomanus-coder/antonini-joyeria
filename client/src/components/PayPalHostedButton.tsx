import { useEffect, useRef, useState } from "react";
import { AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import { PAYPAL_HOSTED_BUTTON_ID } from "@/lib/paypalHostedButton";

type PayPalHostedButtonsApi = {
  HostedButtons: (config: { hostedButtonId: string }) => {
    render: (container: HTMLElement | string) => void;
  };
};

declare global {
  interface Window {
    paypal?: PayPalHostedButtonsApi;
  }
}

const PAYPAL_SCRIPT_ID = "paypal-hosted-buttons-sdk";

export default function PayPalHostedButton() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    const script = document.getElementById(PAYPAL_SCRIPT_ID) as HTMLScriptElement | null;

    const renderButton = () => {
      if (cancelled || !container || !window.paypal?.HostedButtons) return;
      try {
        container.replaceChildren();
        window.paypal.HostedButtons({ hostedButtonId: PAYPAL_HOSTED_BUTTON_ID }).render(container);
        setStatus("ready");
      } catch {
        setStatus("error");
      }
    };

    if (window.paypal?.HostedButtons) {
      renderButton();
    } else if (script) {
      script.addEventListener("load", renderButton, { once: true });
      script.addEventListener("error", () => !cancelled && setStatus("error"), { once: true });
    } else {
      setStatus("error");
    }

    return () => {
      cancelled = true;
      script?.removeEventListener("load", renderButton);
      container?.replaceChildren();
    };
  }, []);

  return (
    <div id="paypal-hosted-button" className="mt-4 border border-[#0070ba]/25 bg-[#f7fbff] p-4" aria-live="polite">
      <div className="mb-3 flex items-start gap-2.5">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#0070ba]" />
        <div>
          <p className="text-sm font-bold text-[#003087]">Finalizar pago con PayPal</p>
          <p className="mt-0.5 text-xs leading-relaxed text-gray-600">Indica el valor en USD y selecciona el botón oficial de PayPal. Se abrirá su página segura para completar el pago.</p>
        </div>
      </div>

      {status === "loading" && (
        <div className="flex min-h-11 items-center justify-center gap-2 text-xs text-gray-500">
          <Loader2 size={15} className="animate-spin text-[#0070ba]" /> Cargando pago seguro…
        </div>
      )}
      <div ref={containerRef} className={status === "ready" ? "block" : "hidden"} />
      {status === "error" && (
        <p className="flex items-start gap-2 text-xs leading-relaxed text-red-700">
          <AlertCircle size={15} className="mt-0.5 shrink-0" /> No fue posible cargar PayPal. Recarga la página o elige otro método de pago.
        </p>
      )}
    </div>
  );
}
