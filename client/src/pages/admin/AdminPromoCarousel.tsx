import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, RefreshCw, Save, Trash2, Upload, Video } from "lucide-react";

type PromoSlide = {
  id: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  ctaLabel: string;
  ctaHref: string;
};

const newId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function AdminPromoCarousel() {
  const utils = trpc.useUtils();
  const { data: config, isLoading } = trpc.siteConfig.getPromoCarousel.useQuery();
  const inputRef = useRef<HTMLInputElement>(null);
  const [slides, setSlides] = useState<PromoSlide[]>([]);
  const [intervalMs, setIntervalMs] = useState(6000);
  const [uploading, setUploading] = useState(false);
  const [replaceSlideId, setReplaceSlideId] = useState<string | null>(null);

  useEffect(() => {
    if (!config) return;
    setSlides(config.slides as PromoSlide[]);
    setIntervalMs(config.intervalMs);
  }, [config]);

  const saveMutation = trpc.siteConfig.updatePromoCarousel.useMutation({
    onSuccess: () => {
      utils.siteConfig.getPromoCarousel.invalidate();
      toast.success("Carrusel promocional actualizado");
    },
    onError: (error) => toast.error(error.message),
  });

  const updateSlide = (id: string, patch: Partial<PromoSlide>) => {
    setSlides(current => current.map(slide => slide.id === id ? { ...slide, ...patch } : slide));
  };

  const moveSlide = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= slides.length) return;
    setSlides(current => {
      const result = [...current];
      [result[index], result[nextIndex]] = [result[nextIndex], result[index]];
      return result;
    });
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024 * 1024) { toast.error("El archivo no puede superar 500 MB"); return; }
    setUploading(true);
    event.target.value = "";
    try {
      const formData = new FormData();
      formData.append("media", file);
      const response = await fetch("/api/upload/promo-carousel-media", { method: "POST", body: formData, credentials: "include" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No fue posible subir el archivo");
      if (replaceSlideId) {
        updateSlide(replaceSlideId, { mediaUrl: data.url, mediaType: data.mediaType });
        toast.success("Medio reemplazado. Guarda los cambios para publicarlo.");
      } else {
        setSlides(current => [...current, {
          id: newId(),
          mediaUrl: data.url,
          mediaType: data.mediaType,
          ctaLabel: "Ver Colección",
          ctaHref: "/catalogo",
        }]);
        toast.success("Medio agregado. Guarda los cambios para publicarlo.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al subir el archivo");
    } finally {
      setUploading(false);
      setReplaceSlideId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl p-5 md:p-6">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green text-white"><Video size={20} /></div>
          <h1 className="text-2xl font-bold text-gray-900">Carrusel Promocional</h1>
          <p className="mt-1 text-sm text-gray-500">Administra imágenes y videos del bloque promocional independiente de la página de inicio.</p>
        </div>
        <button
          onClick={() => saveMutation.mutate({ intervalMs, slides })}
          disabled={saveMutation.isPending || uploading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-green-light disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Guardar carrusel
        </button>
      </div>

      <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">Cambio automático</label>
        <div className="flex max-w-sm items-center gap-3">
          <input
            type="number"
            min={3}
            max={15}
            value={intervalMs / 1000}
            onChange={event => setIntervalMs(Math.min(15000, Math.max(3000, Number(event.target.value || 6) * 1000)))}
            className="w-24 rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand-green"
          />
          <span className="text-sm text-gray-500">segundos entre diapositivas</span>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-dashed border-brand-green/40 bg-brand-green/5 p-6 text-center">
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" className="hidden" onChange={handleUpload} />
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-brand-green shadow-sm"><ImagePlus size={20} /></div>
          <p className="font-semibold text-gray-800">Añade una imagen o video</p>
        <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-gray-500">Formatos admitidos: JPG, PNG, WebP, MP4, WebM o MOV. Cada medio se convierte en una diapositiva independiente.</p>
        <button onClick={() => inputRef.current?.click()} disabled={uploading} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-brand-green bg-white px-4 py-2.5 text-sm font-semibold text-brand-green transition-colors hover:bg-brand-green hover:text-white disabled:opacity-60">
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} {uploading ? "Subiendo..." : "Seleccionar archivo"}
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-brand-green" /></div>
      ) : slides.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white px-6 py-14 text-center text-sm text-gray-500 shadow-sm">Aún no hay diapositivas. Sube una imagen o video para comenzar.</div>
      ) : (
        <div className="space-y-5">
          {slides.map((slide, index) => (
            <div key={slide.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="grid md:grid-cols-[240px_1fr]">
                <div className="relative min-h-44 bg-gray-100 md:min-h-full">
                  {slide.mediaType === "video" ? <video src={slide.mediaUrl} muted autoPlay loop playsInline className="absolute inset-0 h-full w-full object-cover" /> : <img src={slide.mediaUrl} alt={`Diapositiva ${index + 1}`} className="absolute inset-0 h-full w-full object-cover" />}
                  <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-green">{slide.mediaType === "video" ? "Video" : "Imagen"}</span>
                </div>
                <div className="p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-800">Diapositiva {index + 1}</p>
                    <div className="flex items-center gap-1">
                      <button onClick={() => moveSlide(index, -1)} disabled={index === 0} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30" aria-label="Mover arriba"><ArrowUp size={16} /></button>
                      <button onClick={() => moveSlide(index, 1)} disabled={index === slides.length - 1} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30" aria-label="Mover abajo"><ArrowDown size={16} /></button>
                      <button onClick={() => { setReplaceSlideId(slide.id); inputRef.current?.click(); }} className="rounded-lg p-2 text-brand-green hover:bg-brand-green/10" aria-label="Reemplazar medio"><RefreshCw size={16} /></button>
                      <button onClick={() => setSlides(current => current.filter(item => item.id !== slide.id))} className="rounded-lg p-2 text-red-500 hover:bg-red-50" aria-label="Eliminar diapositiva"><Trash2 size={16} /></button>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Texto del CTA
                      <input value={slide.ctaLabel} onChange={event => updateSlide(slide.id, { ctaLabel: event.target.value })} className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-800 outline-none focus:border-brand-green" />
                    </label>
                    <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Enlace del CTA
                      <input value={slide.ctaHref} onChange={event => updateSlide(slide.id, { ctaHref: event.target.value })} className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-green" placeholder="/catalogo" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
