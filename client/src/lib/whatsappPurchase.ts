const ANTONINI_WHATSAPP_NUMBER = "573169308533";

type WhatsAppPurchaseInput = {
  productName: string;
  priceLabel: string;
  reference?: string | null;
  selectedOption?: string;
};

export function buildWhatsAppPurchaseUrl({
  productName,
  priceLabel,
  reference,
  selectedOption,
}: WhatsAppPurchaseInput) {
  const referenceMessage = reference?.trim() ? ` Referencia: ${reference.trim()}.` : "";
  const optionMessage = selectedOption ? ` Seleccioné ${selectedOption}.` : "";
  const message = `Hola Antonini Joyería, quiero comprar ${productName}.${referenceMessage}${optionMessage} El precio mostrado es ${priceLabel}. ¿El envío gratis está disponible para mi ciudad?`;

  return `https://wa.me/${ANTONINI_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
