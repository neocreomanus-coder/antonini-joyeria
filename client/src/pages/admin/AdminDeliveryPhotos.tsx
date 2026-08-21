import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, RefreshCw, Save, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type DeliveryPhoto = {
  id: string;
  imageUrl: string;
  alt: string;
};

const newId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function AdminDeliveryPhotos() {
  const utils = trpc.useUtils();
  const { data: config, isLoading } = trpc.siteConfig.getDeliveryPhotos.useQuery();
  const [photos, setPhotos] = useState<DeliveryPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [replacePhotoId, setReplacePhotoId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (config) setPhotos(config.photos as DeliveryPhoto[]);
  }, [config]);

  const saveMutation = trpc.siteConfig.updateDeliveryPhotos.useMutation({
    onSuccess: () => {
      utils.siteConfig.getDeliveryPhotos.invalidate();
      toast.success("Fotos de entregas seguras actualizadas");
    },
    onError: (error) => toast.error(error.message),
  });

  const updatePhoto = (id: string, patch: Partial<DeliveryPhoto>) => {
    setPhotos(current => current.map(photo => photo.id === id ? { ...photo, ...patch } : photo));
  };

  const movePhoto = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= photos.length) return;
    setPhotos(current => {
      const result = [...current];
      [result[index], result[nextIndex]] = [result[nextIndex], result[index]];
      return result;
    });
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Selecciona una imagen JPG, PNG o WebP"); return; }
    if (file.size > 12 * 1024 * 1024) { toast.error("La imagen no puede superar 12 MB"); return; }
    event.target.value = "";
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await fetch("/api/upload/delivery-photo", { method: "POST", body: formData, credentials: "include" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No fue posible subir la imagen");
      if (replacePhotoId) {
        updatePhoto(replacePhotoId, { imageUrl: data.url });
        toast.success("Imagen reemplazada. Guarda los cambios para publicarla.");
      } else {
        if (photos.length >= 24) { toast.error("Puedes mostrar hasta 24 fotos"); return; }
        setPhotos(current => [...current, { id: newId(), imageUrl: data.url, alt: "Cliente feliz con su compra" }]);
        toast.success("Imagen agregada. Guarda los cambios para publicarla.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al subir la imagen");
    } finally {
      setUploading(false);
      setReplacePhotoId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-5 md:p-6">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green text-white"><ImagePlus size={20} /></div>
          <h1 className="text-2xl font-bold text-gray-900">Entregas Seguras</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Gestiona las fotos de clientes que se muestran en la sección “Nuestros clientes nos recomiendan” de la página de inicio.</p>
        </div>
        <button
          onClick={() => saveMutation.mutate({ photos })}
          disabled={saveMutation.isPending || uploading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-green-light disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Guardar fotos
        </button>
      </div>

      <div className="mb-6 rounded-2xl border border-dashed border-brand-green/40 bg-brand-green/5 p-6 text-center">
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleUpload} />
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-brand-green shadow-sm"><Upload size={20} /></div>
        <p className="font-semibold text-gray-800">Añade una foto de entrega</p>
        <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-gray-500">Formatos admitidos: JPG, PNG o WebP. El orden que definas aquí será el orden que verá el cliente.</p>
        <button onClick={() => inputRef.current?.click()} disabled={uploading} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-brand-green bg-white px-4 py-2.5 text-sm font-semibold text-brand-green transition-colors hover:bg-brand-green hover:text-white disabled:opacity-60">
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />} {uploading ? "Subiendo..." : "Seleccionar imagen"}
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-brand-green" /></div>
      ) : photos.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white px-6 py-14 text-center text-sm text-gray-500 shadow-sm">No hay fotos publicadas. Sube la primera imagen para mostrarla en la tienda.</div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {photos.map((photo, index) => (
            <div key={photo.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="relative aspect-square bg-gray-100">
                <img src={photo.imageUrl} alt={photo.alt} className="h-full w-full object-cover" />
                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-green">Foto {index + 1}</span>
              </div>
              <div className="p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-gray-800">Entrega {index + 1}</p>
                  <div className="flex items-center gap-1">
                    <button onClick={() => movePhoto(index, -1)} disabled={index === 0} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30" aria-label="Mover arriba"><ArrowUp size={16} /></button>
                    <button onClick={() => movePhoto(index, 1)} disabled={index === photos.length - 1} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30" aria-label="Mover abajo"><ArrowDown size={16} /></button>
                    <button onClick={() => { setReplacePhotoId(photo.id); inputRef.current?.click(); }} className="rounded-lg p-2 text-brand-green hover:bg-brand-green/10" aria-label="Reemplazar imagen"><RefreshCw size={16} /></button>
                    <button onClick={() => setPhotos(current => current.filter(item => item.id !== photo.id))} className="rounded-lg p-2 text-red-500 hover:bg-red-50" aria-label="Eliminar imagen"><Trash2 size={16} /></button>
                  </div>
                </div>
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">Descripción alternativa
                  <input value={photo.alt} onChange={event => updatePhoto(photo.id, { alt: event.target.value })} className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-green" placeholder="Cliente feliz con su compra" />
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
