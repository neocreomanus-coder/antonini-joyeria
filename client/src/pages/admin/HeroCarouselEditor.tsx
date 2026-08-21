import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Save, Trash2, Upload } from "lucide-react";

type HeroSlide = {
  id: string;
  mediaUrl: string;
  mediaType: "image" | "video";
};

const newSlideId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function HeroCarouselEditor() {
  const utils = trpc.useUtils();
  const { data: config, isLoading } = trpc.siteConfig.getHero.useQuery();
  const inputRef = useRef<HTMLInputElement>(null);
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [intervalMs, setIntervalMs] = useState(6500);
  const [uploading, setUploading] = useState(false);
  const [replaceId, setReplaceId] = useState<string | null>(null);

  useEffect(() => {
    if (!config) return;
    setSlides(config.slides as HeroSlide[]);
    setIntervalMs(config.intervalMs ?? 6500);
  }, [config]);

  const saveMutation = trpc.siteConfig.updateHeroCarousel.useMutation({
    onSuccess: () => {
      utils.siteConfig.getHero.invalidate();
      toast.success("Carrusel principal actualizado");
    },
    onError: error => toast.error(error.message),
  });

  const moveSlide = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= slides.length) return;
    setSlides(current => {
      const result = [...current];
      [result[index], result[target]] = [result[target], result[index]];
      return result;
    });
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024 * 1024) {
      toast.error("El archivo no puede superar 500 MB");
      return;
    }
    setUploading(true);
    event.target.value = "";
    try {
      const formData = new FormData();
      formData.append("media", file);
      const response = await fetch("/api/upload/promo-carousel-media", { method: "POST", body: formData, credentials: "include" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No fue posible subir el archivo");
      if (replaceId) {
        setSlides(current => current.map(slide => slide.id === replaceId ? { ...slide, mediaUrl: data.url, mediaType: data.mediaType } : slide));
      } else {
        setSlides(current => [...current, { id: newSlideId(), mediaUrl: data.url, mediaType: data.mediaType }]);
      }
      toast.success("Diapositiva lista. Guarda el carrusel para publicarla.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al subir el archivo");
    } finally {
      setUploading(false);
      setReplaceId(null);
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-gray-800"><ImagePlus size={16} className="text-brand-green" /> Carrusel principal</h2>
          <p className="mt-0.5 text-xs text-gray-500">Gestiona imágenes y videos, su orden y el cambio automático del hero.</p>
        </div>
        <button onClick={() => saveMutation.mutate({ intervalMs, slides })} disabled={slides.length === 0 || uploading || saveMutation.isPending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          {saveMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Guardar carrusel
        </button>
      </div>
      <div className="space-y-5 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Cambio automático
            <input type="number" min={3} max={15} value={intervalMs / 1000} onChange={event => setIntervalMs(Math.min(15000, Math.max(3000, Number(event.target.value || 6) * 1000)))} className="ml-3 w-20 rounded-lg border border-gray-200 px-2 py-2 text-sm text-gray-800 outline-none focus:border-brand-green" />
            <span className="ml-2 normal-case font-normal tracking-normal">segundos</span>
          </label>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" className="hidden" onChange={handleUpload} />
          <button onClick={() => inputRef.current?.click()} disabled={uploading} className="inline-flex items-center gap-2 rounded-lg border border-brand-green px-3 py-2 text-sm font-semibold text-brand-green hover:bg-brand-green hover:text-white disabled:opacity-50">
            {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} Añadir diapositiva
          </button>
        </div>
        {isLoading ? <div className="flex justify-center py-8"><Loader2 className="animate-spin text-brand-green" /></div> : slides.length === 0 ? <p className="rounded-xl bg-gray-50 p-5 text-sm text-gray-500">Aún no hay diapositivas. Añade una imagen o video para activar el carrusel del hero.</p> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {slides.map((slide, index) => <article key={slide.id} className="overflow-hidden rounded-xl border border-gray-100">
            <div className="relative aspect-video bg-gray-100">
              {slide.mediaType === "video" ? <video src={slide.mediaUrl} muted autoPlay loop playsInline className="h-full w-full object-cover" /> : <img src={slide.mediaUrl} alt={`Diapositiva ${index + 1}`} className="h-full w-full object-cover" />}
              <span className="absolute left-2 top-2 rounded bg-black/60 px-2 py-1 text-[10px] font-bold uppercase text-white">{slide.mediaType === "video" ? "Video" : "Imagen"}</span>
            </div>
            <div className="flex items-center justify-between p-2">
              <span className="text-xs font-semibold text-gray-600">Diapositiva {index + 1}</span>
              <div className="flex gap-1">
                <button onClick={() => moveSlide(index, -1)} disabled={index === 0} className="rounded p-1.5 text-gray-500 disabled:opacity-30" aria-label="Mover arriba"><ArrowUp size={15} /></button>
                <button onClick={() => moveSlide(index, 1)} disabled={index === slides.length - 1} className="rounded p-1.5 text-gray-500 disabled:opacity-30" aria-label="Mover abajo"><ArrowDown size={15} /></button>
                <button onClick={() => { setReplaceId(slide.id); inputRef.current?.click(); }} className="rounded p-1.5 text-brand-green" aria-label="Reemplazar diapositiva"><Upload size={15} /></button>
                <button onClick={() => setSlides(current => current.filter(item => item.id !== slide.id))} className="rounded p-1.5 text-red-500" aria-label="Eliminar diapositiva"><Trash2 size={15} /></button>
              </div>
            </div>
          </article>)}
        </div>}
      </div>
    </section>
  );
}
