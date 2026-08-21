const ANTONINI_WHATSAPP_NUMBER = "573169308533";

type WhatsAppPurchaseInput = {
  productName: string;
  priceLabel: string;
  selectedOption?: string;
};

export function buildWhatsAppPurchaseUrl({
  productName,
  priceLabel,
  selectedOption,
}: WhatsAppPurchaseInput) {
  const optionMessage = selectedOption ? ` Seleccioné ${selectedOption}.` : "";
  const message = `Hola Antonini Joyería, quiero comprar ${productName}.${optionMessage} El precio mostrado es ${priceLabel}. ¿El envío gratis está disponible para mi ciudad?`;

  return `https://wa.me/${ANTONINI_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
