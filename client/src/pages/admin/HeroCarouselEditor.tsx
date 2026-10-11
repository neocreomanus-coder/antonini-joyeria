import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Save, Upload, Video } from "lucide-react";

type FixedHeroVideo = {
  id: string;
  mediaUrl: string;
  mediaType: "video";
};

const newVideoId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function HeroCarouselEditor() {
  const utils = trpc.useUtils();
  const { data: config, isLoading } = trpc.siteConfig.getHero.useQuery();
  const inputRef = useRef<HTMLInputElement>(null);
  const [video, setVideo] = useState<FixedHeroVideo | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!config) return;
    setVideo((config.slides as FixedHeroVideo[]).find((slide) => slide.mediaType === "video") ?? null);
  }, [config]);

  const saveMutation = trpc.siteConfig.updateHeroCarousel.useMutation({
    onSuccess: () => {
      utils.siteConfig.getHero.invalidate();
      toast.success("Video principal actualizado");
    },
    onError: (error) => toast.error(error.message),
  });

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
      formData.append("video", file);
      const response = await fetch("/api/upload/hero-video", { method: "POST", body: formData, credentials: "include" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No fue posible subir el archivo");

      setVideo({ id: video?.id ?? newVideoId(), mediaUrl: data.url, mediaType: "video" });
      toast.success("Video listo. Guarda los cambios para publicarlo.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al subir el archivo");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    if (!video) return;
    saveMutation.mutate({ intervalMs: 6500, slides: [video] });
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-gray-800"><Video size={17} className="text-brand-green" /> Video principal fijo</h2>
          <p className="mt-0.5 text-xs text-gray-500">El hero muestra un único video. Reemplázalo aquí cuando necesites actualizarlo.</p>
        </div>
        <button onClick={handleSave} disabled={!video || uploading || saveMutation.isPending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          {saveMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Guardar video
        </button>
      </div>

      <div className="p-6">
        <input ref={inputRef} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={handleUpload} />
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-brand-green" /></div>
        ) : video ? (
          <article className="mx-auto max-w-3xl overflow-hidden rounded-xl border border-gray-100">
            <div className="relative aspect-video bg-gray-100">
              <video src={video.mediaUrl} muted autoPlay loop playsInline controls className="h-full w-full object-cover" />
              <span className="absolute left-3 top-3 rounded bg-black/60 px-2 py-1 text-[10px] font-bold uppercase text-white">Video fijo</span>
            </div>
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700">Video actual del hero</p>
                <p className="mt-0.5 text-xs text-gray-500">No hay orden de diapositivas ni cambio automático.</p>
              </div>
              <button onClick={() => inputRef.current?.click()} disabled={uploading} className="inline-flex items-center justify-center gap-2 rounded-lg border border-brand-green px-3 py-2 text-sm font-semibold text-brand-green hover:bg-brand-green hover:text-white disabled:opacity-50">
                {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} Reemplazar video
              </button>
            </div>
          </article>
        ) : (
          <div className="mx-auto max-w-xl rounded-xl bg-gray-50 p-8 text-center">
            <Video className="mx-auto mb-3 text-brand-green" size={28} />
            <p className="text-sm font-semibold text-gray-700">Aún no hay video configurado</p>
            <p className="mt-1 text-xs text-gray-500">Sube un único video para activar el hero principal.</p>
            <button onClick={() => inputRef.current?.click()} disabled={uploading} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-green px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} Subir video
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
