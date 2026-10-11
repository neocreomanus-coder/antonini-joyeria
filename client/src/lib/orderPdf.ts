import { formatOrderNumber } from "./paymentFlow";

export type OrderPdfData = {
  id: number;
  orderNumber?: string | null;
  status?: string | null;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  shippingCarrier?: string | null;
  interrapidisimoGuide?: string | null;
  total: string | number;
  subtotal: string | number;
  popupDiscountPercent?: number | null;
  popupDiscountAmount?: string | number | null;
  promoCode?: string | null;
  promoDiscountPercent?: number | null;
  promoDiscountAmount?: string | number | null;
  guestEmail?: string | null;
  shippingAddress?: unknown;
  notes?: string | null;
  createdAt: Date | string;
  items?: Array<{
    id: number;
    quantity: number;
    unitPrice: string | number;
    productSnapshot?: unknown;
  }>;
};

const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  despachado: "Despachado",
  entregado: "Entregado",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  contraentrega: "Pago contra entrega",
  wompi: "Wompi",
  paypal: "PayPal",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pendiente_contraentrega: "Pendiente contra entrega",
  pendiente_comprobante: "Pendiente de comprobante",
  comprobante_enviado: "Comprobante enviado",
  verificado: "Pago verificado",
};

const SHIPPING_CARRIER_LABELS: Record<string, string> = {
  coordinadora: "Coordinadora",
  interrapidisimo: "Inter Rapidísimo",
  dhl: "DHL",
};

type PdfAddress = {
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  department?: string | null;
  notes?: string | null;
};

type ProductSnapshot = {
  name?: string | null;
  material?: string | null;
  reference?: string | null;
  variantLabel?: string | null;
};

function asObject<T>(value: unknown): T {
  return (value && typeof value === "object" ? value : {}) as T;
}

export function getOrderPdfFilename(order: Pick<OrderPdfData, "id" | "orderNumber">) {
  return `pedido-${formatOrderNumber(order.orderNumber ?? order.id)}.pdf`;
}

export function getShippingCarrierLabel(carrier?: string | null) {
  return SHIPPING_CARRIER_LABELS[carrier ?? ""] ?? "Inter Rapidísimo";
}

function formatPrice(value: string | number | null | undefined) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(Number(value ?? 0));
}

function asText(value: unknown) {
  return String(value ?? "—").replace(/\s+/g, " ").trim() || "—";
}

export async function downloadOrderPdf(order: OrderPdfData) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const drawHeader = () => {
    doc.setFillColor(13, 59, 46);
    doc.rect(0, 0, pageWidth, 29, "F");
    doc.setTextColor(201, 168, 76);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("ANTONINI JOYERÍA", margin, 13);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Resumen de pedido", margin, 19);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(formatOrderNumber(order.orderNumber ?? order.id), pageWidth - margin, 14, { align: "right" });
    y = 39;
  };

  const drawFooter = () => {
    const totalPages = doc.getNumberOfPages();
    for (let page = 1; page <= totalPages; page += 1) {
      doc.setPage(page);
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, pageHeight - 13, pageWidth - margin, pageHeight - 13);
      doc.setTextColor(95, 95, 95);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.text("Antonini Joyería · Documento generado desde la tienda", margin, pageHeight - 8);
      doc.text(`Página ${page} de ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: "right" });
    }
  };

  const ensureSpace = (height: number) => {
    if (y + height <= pageHeight - 19) return;
    doc.addPage();
    drawHeader();
  };

  const sectionTitle = (title: string) => {
    ensureSpace(12);
    doc.setFillColor(248, 246, 239);
    doc.rect(margin, y, contentWidth, 8, "F");
    doc.setTextColor(13, 59, 46);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(title.toUpperCase(), margin + 3, y + 5.2);
    y += 12;
  };

  const line = (label: string, value: unknown, accent = false) => {
    const lines = doc.splitTextToSize(asText(value), contentWidth - 48) as string[];
    const height = Math.max(6, lines.length * 4.5 + 2);
    ensureSpace(height);
    doc.setTextColor(80, 80, 80);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text(label, margin, y + 3.8);
    doc.setTextColor(accent ? 13 : 45, accent ? 59 : 45, accent ? 46 : 45);
    doc.setFont("helvetica", accent ? "bold" : "normal");
    doc.text(lines, pageWidth - margin, y + 3.8, { align: "right" });
    y += height;
  };

  drawHeader();

  const createdAt = new Date(order.createdAt);
  sectionTitle("Información del pedido");
  line("Número de pedido", formatOrderNumber(order.orderNumber ?? order.id), true);
  line("Fecha", Number.isNaN(createdAt.getTime()) ? "—" : createdAt.toLocaleString("es-CO", { dateStyle: "long", timeStyle: "short" }));
  line("Estado", STATUS_LABELS[order.status ?? ""] ?? asText(order.status));
  line("Método de pago", PAYMENT_METHOD_LABELS[order.paymentMethod ?? ""] ?? asText(order.paymentMethod));
  line("Estado del pago", PAYMENT_STATUS_LABELS[order.paymentStatus ?? ""] ?? asText(order.paymentStatus));

  sectionTitle("Cliente y entrega");
  const address = asObject<PdfAddress>(order.shippingAddress);
  line("Cliente", address?.fullName);
  line("Correo", order.guestEmail ?? address?.email);
  line("Teléfono", address?.phone);
  line("Dirección", [address?.address, address?.city, address?.department].filter(Boolean).join(", "));
  line("Transportadora", getShippingCarrierLabel(order.shippingCarrier));
  line("Guía", order.interrapidisimoGuide ?? "Aún no asignada");
  if (address?.notes || order.notes) line("Notas", address?.notes ?? order.notes);

  sectionTitle("Productos");
  const columnX = [margin, margin + 69, margin + 112, pageWidth - margin];
  doc.setTextColor(95, 95, 95);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("PRODUCTO", columnX[0], y);
  doc.text("REFERENCIA / DETALLE", columnX[1], y);
  doc.text("CANT.", columnX[2], y, { align: "right" });
  doc.text("TOTAL", columnX[3], y, { align: "right" });
  y += 4;
  doc.setDrawColor(210, 210, 210);
  doc.line(margin, y, pageWidth - margin, y);
  y += 3;

  for (const item of order.items ?? []) {
    const snapshot = asObject<ProductSnapshot>(item.productSnapshot);
    const detail = [snapshot.reference ? `Ref. ${snapshot.reference}` : null, snapshot.material, snapshot.variantLabel].filter(Boolean).join(" · ");
    const productLines = doc.splitTextToSize(asText(snapshot.name), 62) as string[];
    const detailLines = doc.splitTextToSize(asText(detail), 39) as string[];
    const rowHeight = Math.max(productLines.length, detailLines.length) * 4.2 + 6;
    ensureSpace(rowHeight + 1);
    doc.setTextColor(35, 35, 35);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.3);
    doc.text(productLines, columnX[0], y + 3.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(90, 90, 90);
    doc.setFontSize(7.5);
    doc.text(detailLines, columnX[1], y + 3.5);
    doc.setTextColor(35, 35, 35);
    doc.setFontSize(8.3);
    doc.text(String(item.quantity), columnX[2], y + 3.5, { align: "right" });
    doc.text(formatPrice(Number(item.unitPrice) * item.quantity), columnX[3], y + 3.5, { align: "right" });
    y += rowHeight;
    doc.setDrawColor(235, 235, 235);
    doc.line(margin, y, pageWidth - margin, y);
    y += 3;
  }

  sectionTitle("Resumen de valores");
  line("Subtotal", formatPrice(order.subtotal));
  if (order.popupDiscountAmount && Number(order.popupDiscountAmount) > 0) {
    line(`Oferta popup${order.popupDiscountPercent ? ` · ${order.popupDiscountPercent}%` : ""}`, `-${formatPrice(order.popupDiscountAmount)}`);
  }
  if (order.promoCode) {
    line(`Código ${order.promoCode}${order.promoDiscountPercent ? ` · ${order.promoDiscountPercent}%` : ""}`, `-${formatPrice(order.promoDiscountAmount)}`);
  }
  line("Envío", "Gratis");
  line("TOTAL", formatPrice(order.total), true);

  drawFooter();
  doc.save(getOrderPdfFilename(order));
}
