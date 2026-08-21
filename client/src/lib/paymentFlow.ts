export const WOMPI_PAYMENT_URL = "https://checkout.wompi.co/l/VPOS_NHrLJj";
export const WOMPI_PAYMENT_BUTTON_IMAGE = "/manus-storage/wompi-payment-button_9e76ada3.webp";
export const STORE_WHATSAPP_NUMBER = "57316930853";
export const PAYMENT_RESERVATION_MS = 10 * 60 * 1000;

export function formatOrderNumber(orderId: number) {
  return `ANT-${String(orderId).padStart(6, "0")}`;
}

export function buildPaymentProofWhatsAppUrl(input: { orderId: number; total: string | number }) {
  const orderNumber = formatOrderNumber(input.orderId);
  const total = Number(input.total).toLocaleString("es-CO");
  const text = [
    "Hola, Antonini Joyería.",
    `Confirmo que realicé el pago de mi pedido ${orderNumber}.`,
    `Valor: $ ${total} COP.`,
    "Adjunto el comprobante para validación y despacho inmediato.",
  ].join("\n");
  return `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}
