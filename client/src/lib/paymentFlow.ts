export const WOMPI_PAYMENT_URL = "https://checkout.wompi.co/l/VPOS_NHrLJj";
export const WOMPI_PAYMENT_BUTTON_IMAGE = "/manus-storage/wompi-payment-button_9e76ada3.webp";
export const STORE_WHATSAPP_NUMBER = "57316930853";
export const PAYMENT_RESERVATION_MS = 10 * 60 * 1000;

export function formatOrderNumber(order: number | string | null | undefined) {
  if (typeof order === "string" && /^ANT-\d{6,}$/i.test(order)) return order.toUpperCase();
  return `ANT-${String(order ?? 0).padStart(6, "0")}`;
}

export function buildPaymentProofWhatsAppUrl(input: { orderId: number; orderNumber?: string | null; total: string | number }) {
  const orderNumber = formatOrderNumber(input.orderNumber ?? input.orderId);
  const total = Number(input.total).toLocaleString("es-CO");
  const text = [
    "Hola, Antonini Joyería.",
    `Confirmo que realicé el pago de mi pedido ${orderNumber}.`,
    `Valor: $ ${total} COP.`,
    "Adjunto el comprobante para validación y despacho inmediato.",
  ].join("\n");
  return `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}
