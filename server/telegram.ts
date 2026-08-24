type TelegramOrderNotification = {
  orderId: number;
  orderNumber?: string;
  paymentMethod: "contraentrega" | "wompi";
  total: string;
  customerName: string;
  customerPhone: string;
  notes?: string;
  popupDiscountPercent?: number;
  popupDiscountAmount?: string;
  promoCode?: string;
  promoDiscountAmount?: string;
  items: Array<{ productSnapshot: { name: string; reference?: string }; quantity: number }>;
};

type TelegramApiError = {
  parameters?: {
    migrate_to_chat_id?: string | number;
  };
};

function formatOrderNumber(orderId: number) {
  return `ANT-${String(orderId).padStart(6, "0")}`;
}

async function sendTelegramTextToChat(token: string, chatId: string, text: string) {
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });

  const payload = typeof (response as any).json === "function"
    ? await (response as any).json().catch(() => null) as TelegramApiError | null
    : null;
  const migratedChatId = payload?.parameters?.migrate_to_chat_id;

  return {
    sent: response.ok,
    migratedChatId: migratedChatId === undefined ? undefined : String(migratedChatId),
  };
}

async function sendTelegramText(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return { sent: false, reason: "not_configured" as const };

  try {
    const firstAttempt = await sendTelegramTextToChat(token, chatId, text);
    if (firstAttempt.sent) return { sent: true, reason: undefined };

    if (firstAttempt.migratedChatId) {
      const retry = await sendTelegramTextToChat(token, firstAttempt.migratedChatId, text);
      if (retry.sent) return { sent: true, reason: undefined };
    }

    return { sent: false, reason: "telegram_error" as const };
  } catch (error) {
    console.error("[Telegram] No fue posible enviar la notificación", error);
    return { sent: false, reason: "network_error" as const };
  }
}

export async function sendTelegramConnectionTest() {
  return sendTelegramText("✅ Antonini Joyería: conexión con Telegram verificada. Esta es una prueba técnica y no corresponde a un pedido real.");
}

export async function notifyTelegramAboutOrder(order: TelegramOrderNotification) {
  const paymentLabel = order.paymentMethod === "wompi" ? "Wompi · comprobante pendiente" : "Pago contraentrega";
  const products = order.items.map((item) => `• ${item.productSnapshot.name}${item.productSnapshot.reference ? ` · Ref. ${item.productSnapshot.reference}` : ""} × ${item.quantity}`).join("\n");
  const total = Number(order.total).toLocaleString("es-CO");
  const notes = order.notes?.trim();
  const popupOffer = order.popupDiscountPercent
    ? `Oferta popup: ${order.popupDiscountPercent}% OFF · -$ ${Number(order.popupDiscountAmount ?? 0).toLocaleString("es-CO")} COP`
    : null;
  const promo = order.promoCode
    ? `Código promocional usado: ${order.promoCode} · -$ ${Number(order.promoDiscountAmount ?? 0).toLocaleString("es-CO")} COP`
    : "Código promocional: sin aplicar";
  const text = [
    "🛍️ Nuevo pedido Antonini",
    `Pedido: ${order.orderNumber ?? formatOrderNumber(order.orderId)}`,
    `Método: ${paymentLabel}`,
    `Cliente: ${order.customerName}`,
    `WhatsApp: ${order.customerPhone}`,
    `Total: $ ${total} COP`,
    ...(popupOffer ? [popupOffer] : []),
    promo,
    "Productos:",
    products,
    ...(notes ? ["Notas adicionales:", notes] : []),
  ].join("\n");

  return sendTelegramText(text);
}
