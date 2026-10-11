import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadOrderPdf, type OrderPdfData } from "@/lib/orderPdf";

type OrderPdfButtonProps = {
  order: OrderPdfData;
  className?: string;
};

export default function OrderPdfButton({ order, className = "" }: OrderPdfButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      await downloadOrderPdf(order);
      toast.success("PDF del pedido descargado");
    } catch {
      toast.error("No fue posible generar el PDF del pedido");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleDownload}
      disabled={isGenerating}
      className={`gap-2 border-brand-green text-brand-green hover:bg-brand-green hover:text-white ${className}`}
    >
      <Download size={16} />
      {isGenerating ? "Generando PDF…" : "Descargar PDF"}
    </Button>
  );
}
