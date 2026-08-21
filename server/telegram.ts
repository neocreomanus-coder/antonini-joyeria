type TelegramOrderNotification = {
  orderId: number;
  paymentMethod: "contraentrega" | "wompi";
  total: string;
  customerName: string;
  customerPhone: string;
  notes?: string;
  items: Array<{ productSnapshot: { name: string }; quantity: number }>;
};

function formatOrderNumber(orderId: number) {
  return `ANT-${String(orderId).padStart(6, "0")}`;
}

async function sendTelegramText(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return { sent: false, reason: "not_configured" as const };

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    return { sent: response.ok, reason: response.ok ? undefined : "telegram_error" as const };
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
  const products = order.items.map((item) => `• ${item.productSnapshot.name} × ${item.quantity}`).join("\n");
  const total = Number(order.total).toLocaleString("es-CO");
  const notes = order.notes?.trim();
  const text = [
    "🛍️ Nuevo pedido Antonini",
    `Pedido: ${formatOrderNumber(order.orderId)}`,
    `Método: ${paymentLabel}`,
    `Cliente: ${order.customerName}`,
    `WhatsApp: ${order.customerPhone}`,
    `Total: $ ${total} COP`,
    "Productos:",
    products,
    ...(notes ? ["Notas adicionales:", notes] : []),
  ].join("\n");

  return sendTelegramText(text);
}
