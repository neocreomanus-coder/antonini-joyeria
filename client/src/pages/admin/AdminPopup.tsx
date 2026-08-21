import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Tag, Eye, EyeOff, Save, Sparkles } from "lucide-react";

export default function AdminPopup() {
  const { data: config, isLoading } = trpc.siteConfig.getPopup.useQuery();
  const { data: products = [] } = trpc.products.adminList.useQuery({});
  const utils = trpc.useUtils();

  const [form, setForm] = useState({
    enabled: true,
    discount: 20,
    title: "¡Oferta Especial!",
    subtitle: "Solo por hoy",
    buttonText: "Aprovechar oferta",
    productId: null as number | null,
  });

  useEffect(() => {
    if (config) setForm({ ...form, ...config });
  }, [config]);

  const updateMutation = trpc.siteConfig.updatePopup.useMutation({
    onSuccess: () => {
      toast.success("Popup actualizado correctamente");
      utils.siteConfig.getPopup.invalidate();
    },
    onError: () => toast.error("Error al guardar el popup"),
  });

  const handleSave = () => updateMutation.mutate(form);

  const selectedProduct = (products as any[]).find((p: any) => p.id === form.productId);

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-sans">Popup de Bienvenida</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configura el popup que aparece al ingresar a la tienda</p>
        </div>
        <button
          onClick={() => setForm(f => ({ ...f, enabled: !f.enabled }))}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-colors ${form.enabled ? "bg-brand-green text-white" : "bg-gray-100 text-gray-600"}`}
        >
          {form.enabled ? <Eye size={15} /> : <EyeOff size={15} />}
          {form.enabled ? "Activo" : "Inactivo"}
        </button>
      </div>

      <div className="space-y-5">
        {/* Preview */}
        <div className="bg-brand-green rounded-2xl p-5 text-white text-center relative overflow-hidden">
          <Sparkles size={16} className="absolute top-3 right-3 text-white/30" />
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1 mb-2 text-xs font-bold tracking-widest uppercase">
            <Tag size={11} /> {form.subtitle}
          </div>
          <p className="font-bold text-lg">{form.title}</p>
          <p className="text-5xl font-black text-brand-gold mt-1">{form.discount}%</p>
          <p className="text-white/70 text-xs">OFF</p>
        </div>

        {/* Discount */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Porcentaje de descuento</label>
          <div className="flex items-center gap-4">
            <input
              type="range" min={1} max={90} value={form.discount}
              onChange={e => setForm(f => ({ ...f, discount: Number(e.target.value) }))}
              className="flex-1 accent-brand-green"
            />
            <span className="text-2xl font-black text-brand-green w-16 text-center">{form.discount}%</span>
          </div>
        </div>

        {/* Texts */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Textos del popup</label>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Título principal</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-green" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Subtítulo (badge superior)</label>
            <input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-green" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Texto del botón</label>
            <input value={form.buttonText} onChange={e => setForm(f => ({ ...f, buttonText: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-green" />
          </div>
        </div>

        {/* Product selector */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Producto destacado en el popup</label>
          <select
            value={form.productId ?? ""}
            onChange={e => setForm(f => ({ ...f, productId: e.target.value ? Number(e.target.value) : null }))}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-green bg-white mb-3"
          >
            <option value="">Sin producto específico (mostrar colección)</option>
            {(products as any[]).map((p: any) => (
              <option key={p.id} value={p.id}>{p.name} — $ {Number(p.basePrice).toLocaleString("es-CO")}</option>
            ))}
          </select>
          {selectedProduct && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {selectedProduct.imageUrls?.[0] ? (
                  <img src={selectedProduct.imageUrls[0]} alt={selectedProduct.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">Sin img</div>
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-brand-gold">{selectedProduct.material}</p>
                <p className="text-sm font-semibold text-gray-800">{selectedProduct.name}</p>
                <p className="text-xs text-brand-green font-bold">$ {Number(selectedProduct.basePrice).toLocaleString("es-CO")}</p>
              </div>
            </div>
          )}
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="w-full flex items-center justify-center gap-2 bg-brand-green text-white py-4 rounded-2xl font-bold text-sm hover:bg-brand-green-light transition-colors shadow-sm active:scale-[0.99] disabled:opacity-70"
        >
          {updateMutation.isPending ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : <Save size={16} />}
          Guardar configuración del popup
        </button>
      </div>
    </div>
  );
}
