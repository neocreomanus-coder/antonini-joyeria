import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Plus, Edit2, Eye, EyeOff, Upload, X, Gem, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import MaterialPicker from "@/components/MaterialPicker";
import { getProductSubcategories } from "@/lib/productSubcategories";
import { normalizeMaterialValue } from "@/lib/materialOptions";

function fmt(n: string | number) { return `$ ${Number(n).toLocaleString("es-CO")}`; }
function slugify(s: string) { return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

export default function AdminProducts() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ name: "", slug: "", reference: "", materials: ["ORO 18K NACIONAL"], basePrice: "", originalPrice: "", categoryId: "", stock: "99", featured: false, homeSection: "", volumeMl: "", gender: "" });

  // ── Variants state ──
  const RING_SIZES   = ["5","6","7","8","9","10","11","12","13","14"];
  const LENGTH_CM    = ["14","16","18","20","22","24","26","28","30","35","40","45","50","55","60"];
  const [variantType, setVariantType] = useState<"none"|"tallas"|"largos">("none");
  const [selectedSizes, setSelectedSizes]   = useState<string[]>([]);
  const [selectedLengths, setSelectedLengths] = useState<string[]>([]);
  const [customSize, setCustomSize] = useState("");
  const [customLength, setCustomLength] = useState("");

  const toggleSize = (v: string) => setSelectedSizes(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);
  const toggleLength = (v: string) => setSelectedLengths(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);
  const addCustomSize = () => {
    const v = customSize.trim();
    if (v && !selectedSizes.includes(v)) { setSelectedSizes(p => [...p, v]); }
    setCustomSize("");
  };
  const addCustomLength = () => {
    const v = customLength.trim();
    if (v && !selectedLengths.includes(v)) { setSelectedLengths(p => [...p, v]); }
    setCustomLength("");
  };

  const { data: products = [], isLoading } = trpc.products.adminList.useQuery({ search: search || undefined });
  const { data: categories = [] } = trpc.categories.listAll.useQuery();
  const selectedCategory = (categories as any[]).find((category: any) => String(category.id) === form.categoryId);
  const isPerfumeriaCategory = selectedCategory?.slug === "perfumeria";

  // Auto-detect variant type from category name (must be after categories declaration)
  useEffect(() => {
    if (!form.categoryId) return;
    const cat = (categories as any[]).find((c: any) => String(c.id) === form.categoryId);
    if (!cat) return;
    const name = (cat.name as string).toLowerCase();
    if (name.includes("anillo") || name.includes("argolla")) {
      setVariantType("tallas");
    } else if (name.includes("cadena") || name.includes("pulsera") || name.includes("pulso") || name.includes("brazalete")) {
      setVariantType("largos");
    } else {
      setVariantType("none");
    }
  }, [form.categoryId, categories]);

  const createMutation = trpc.products.create.useMutation({ onSuccess: () => { toast.success("Producto creado"); utils.products.adminList.invalidate(); reset(); } });
  const updateMutation = trpc.products.update.useMutation({ onSuccess: () => { toast.success("Actualizado"); utils.products.adminList.invalidate(); reset(); } });
  const toggleMutation = trpc.products.toggleActive.useMutation({ onSuccess: () => utils.products.adminList.invalidate() });
  const deleteMutation = trpc.products.delete.useMutation({ onSuccess: (result: any) => {
    toast.success(result?.archived ? "Producto retirado de la tienda; se conservaron sus pedidos" : "Producto eliminado");
    utils.products.adminList.invalidate();
    reset();
  } });
  const reset = () => {
    setShowForm(false); setEditId(null); setImages([]);
    setForm({ name: "", slug: "", reference: "", materials: ["ORO 18K NACIONAL"], basePrice: "", originalPrice: "", categoryId: "", stock: "99", featured: false, homeSection: "", volumeMl: "", gender: "" });
    setVariantType("none"); setSelectedSizes([]); setSelectedLengths([]); setCustomSize(""); setCustomLength("");
  };

  const openEdit = (p: any) => {
    setEditId(p.id);
    setForm({ name: p.name, slug: p.slug, reference: p.reference ?? "", materials: Array.isArray(p.materials) && p.materials.length > 0 ? p.materials.map(normalizeMaterialValue) : [normalizeMaterialValue(p.material)], basePrice: p.basePrice, originalPrice: p.originalPrice ?? "", categoryId: String(p.categoryId ?? ""), stock: String(p.stock ?? 99), featured: p.featured ?? false, homeSection: p.homeSection ?? "", volumeMl: p.volumeMl ? String(p.volumeMl) : "", gender: p.gender ?? "" });
    setImages(Array.isArray(p.imageUrls) ? p.imageUrls : []);
    // Load existing variants
    const variants: any[] = Array.isArray(p.variants) ? p.variants : [];
    const sizes = variants.filter((v: any) => v.type === "size").map((v: any) => v.value);
    const lengths = variants.filter((v: any) => v.type === "length").map((v: any) => v.value);
    setSelectedSizes(sizes);
    setSelectedLengths(lengths);
    if (sizes.length > 0) setVariantType("tallas");
    else if (lengths.length > 0) setVariantType("largos");
    setShowForm(true);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    e.target.value = "";
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Usa una imagen JPG, PNG, WEBP o HEIC");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await fetch("/api/upload/product-image", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.url) throw new Error(result.error || "Error al subir la imagen");
      setImages(p => [...p, result.url]);
      toast.success("Imagen subida correctamente");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al subir la imagen");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const variants =
      variantType === "tallas"
        ? selectedSizes.map(v => ({ type: "size" as const, value: v, stock: 99 }))
        : variantType === "largos"
        ? selectedLengths.map(v => ({ type: "length" as const, value: v, stock: 99 }))
        : [];
    const data = { name: form.name, slug: form.slug, reference: form.reference.trim() || null, materials: form.materials, basePrice: form.basePrice, originalPrice: form.originalPrice || null, categoryId: parseInt(form.categoryId), featured: form.featured, imageUrls: images, stock: parseInt(form.stock) || 0, variants, homeSection: form.homeSection || undefined, volumeMl: form.volumeMl ? parseInt(form.volumeMl) : undefined, gender: (form.gender as any) || undefined };
    if (editId) updateMutation.mutate({ id: editId, ...data });
    else createMutation.mutate(data);
  };

  const handleDelete = (id: number, productName: string) => {
    if (window.confirm(`¿Eliminar “${productName}”? Esta acción no se puede deshacer si el producto no tiene pedidos asociados.`)) {
      deleteMutation.mutate({ id });
    }
  };

  return (

      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-sans font-bold text-gray-900">Productos</h1>
            <p className="text-gray-500 text-sm mt-1">{products.length} productos en el catálogo</p>
          </div>
          <button onClick={() => { reset(); setShowForm(true); }} className="flex items-center gap-2 bg-brand-green text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-brand-green-light transition-colors shadow-sm">
            <Plus size={18} /> Nuevo Producto
          </button>
        </div>

        <div className="relative mb-6">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar productos..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green transition-colors" />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array(8).fill(0).map((_, i) => <div key={i} className="bg-gray-100 rounded-2xl aspect-square animate-pulse" />)}</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((p: any) => {
              const imgs = Array.isArray(p.imageUrls) ? p.imageUrls : [];
              return (
                <div key={p.id} className={`bg-white rounded-2xl border overflow-hidden shadow-sm ${p.active ? "border-gray-100" : "border-red-100 opacity-60"}`}>
                  <div className="aspect-square bg-gray-50 relative overflow-hidden">
                    {imgs[0] ? <img src={imgs[0]} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Gem size={28} className="text-gray-200" /></div>}
                    {!p.active && <div className="absolute inset-0 bg-white/60 flex items-center justify-center"><span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">Inactivo</span></div>}
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] font-bold text-brand-green uppercase tracking-wide">{p.material || "ORO 18K"}</p>
                    <p className="text-xs font-semibold text-gray-800 line-clamp-1 font-sans mt-0.5">{p.name}</p>
                    <p className="text-sm font-bold text-brand-green mt-1">{fmt(p.basePrice)}</p>
                    <div className="flex gap-1.5 mt-2">
                      <button onClick={() => openEdit(p)} className="flex-1 flex items-center justify-center gap-1 border border-gray-200 text-gray-600 py-1.5 rounded-lg text-xs font-medium hover:border-brand-green hover:text-brand-green transition-colors">
                        <Edit2 size={11} /> Editar
                      </button>
                      <button onClick={() => toggleMutation.mutate({ id: p.id, active: !p.active })}
                        className={`p-1.5 rounded-lg border transition-colors ${p.active ? "border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-400" : "border-green-200 text-green-500 hover:border-green-400"}`}>
                        {p.active ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                      <button onClick={() => handleDelete(p.id, p.name)} disabled={deleteMutation.isPending}
                        className="p-1.5 rounded-lg border border-red-100 text-red-500 transition-colors hover:border-red-300 hover:bg-red-50 disabled:opacity-50"
                        aria-label={`Eliminar ${p.name}`}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 bg-brand-green text-white rounded-t-2xl">
                <h2 className="font-sans font-bold text-lg">{editId ? "Editar Producto" : "Nuevo Producto"}</h2>
                <button onClick={reset} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Imágenes</label>
                  <div className="flex flex-wrap gap-2">
                    {images.map((url, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setImages(imgs => imgs.filter((_, j) => j !== i))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">✕</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => fileRef.current?.click()} className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-brand-green hover:text-brand-green transition-colors">
                      {uploading ? <span className="w-5 h-5 border-2 border-brand-green border-t-transparent rounded-full animate-spin" /> : <><Upload size={16} /><span className="text-[10px] mt-1">Subir</span></>}
                    </button>
                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" className="hidden" onChange={handleUpload} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Nombre *</label>
                    <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: editId ? f.slug : slugify(e.target.value) }))} placeholder="Cadena Cubana Oro 18K"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-green transition-colors" />
                  </div>
                  {[
                    { key: "slug", label: "Slug (URL)", placeholder: "cadena-cubana-oro-18k" },
                    { key: "reference", label: "Referencia manual", placeholder: "ej: ANT-CAD-001" },
                    { key: "basePrice", label: "Precio actual *", placeholder: "250000" },
                    { key: "originalPrice", label: "Precio anterior (tachado)", placeholder: "ej: 280000" },
                    { key: "stock", label: "Stock", placeholder: "99" },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
                      <input value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-green transition-colors" />
                    </div>
                  ))}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Materiales</label>
                    <p className="mb-2 text-xs text-gray-400">Puedes elegir varios acabados; el cliente los verá como opciones en la ficha del producto.</p>
                    <MaterialPicker values={form.materials} onChange={(materials) => setForm((current) => ({ ...current, materials }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Categoría *</label>
                    <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-green transition-colors bg-white">
                      <option value="">Seleccionar...</option>
                      {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  {/* ── Sección del Home ── */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Sección del Home</label>
                    <p className="text-xs text-gray-400 mb-2">¿En qué sección especial del home aparece este producto?</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: "",           label: "Ninguna" },
                        { value: "trending",   label: "🔥 En tendencia" },
                        { value: "under300k",  label: "💚 Menos de $300k" },
                        { value: "under800k",  label: "✨ Menos de $800k" },
                        { value: "perfumeria", label: "🌸 Perfumería" },

                      ].map(opt => (
                        <button key={opt.value} type="button"
                          onClick={() => setForm(f => ({ ...f, homeSection: opt.value }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${form.homeSection === opt.value ? "bg-brand-green text-white border-brand-green" : "bg-white text-gray-600 border-gray-200 hover:border-brand-green"}`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ── Campos específicos de perfumería ── */}
                  {isPerfumeriaCategory && <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Volumen (ml)</label>
                    <input type="number" value={form.volumeMl} onChange={e => setForm(f => ({ ...f, volumeMl: e.target.value }))} placeholder="ej: 100"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-green transition-colors" />
                  </div>}
                  <div className={isPerfumeriaCategory ? "" : "md:col-span-2"}>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">{isPerfumeriaCategory ? "Subcategoría de Perfumería" : "Subcategoría de Joyería"}</label>
                    <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-green transition-colors bg-white">
                      {getProductSubcategories(selectedCategory?.slug ?? "").map(({ value, label }) => <option key={value || "sin-especificar"} value={value}>{value ? label : "Sin especificar"}</option>)}
                    </select>
                  </div>

                 {/* ── Variants section ── */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Variantes</label>
                    {/* Type selector */}
                    <div className="flex gap-2 mb-3">
                      {[
                        { value: "none",   label: "Sin variantes" },
                        { value: "tallas", label: "Tallas (anillos)" },
                        { value: "largos", label: "Largo en cm" },
                      ].map(opt => (
                        <button key={opt.value} type="button"
                          onClick={() => { setVariantType(opt.value as any); setSelectedSizes([]); setSelectedLengths([]); setCustomSize(""); setCustomLength(""); }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${variantType === opt.value ? "bg-brand-green text-white border-brand-green" : "bg-white text-gray-600 border-gray-200 hover:border-brand-green"}`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {/* Ring sizes */}
                    {variantType === "tallas" && (
                      <div>
                        <p className="text-xs text-gray-400 mb-2">Selecciona las tallas disponibles:</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {RING_SIZES.map(s => (
                            <button key={s} type="button" onClick={() => toggleSize(s)}
                              className={`w-10 h-10 rounded-lg text-sm font-semibold border-2 transition-colors ${selectedSizes.includes(s) ? "bg-brand-green text-white border-brand-green" : "bg-white text-gray-600 border-gray-200 hover:border-brand-green"}`}>
                              {s}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2 items-center">
                          <input
                            type="text" value={customSize} onChange={e => setCustomSize(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCustomSize())}
                            placeholder="Otra talla (ej: 5.5)"
                            className="w-40 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-green transition-colors"
                          />
                          <button type="button" onClick={addCustomSize}
                            className="px-3 py-2 bg-brand-green text-white rounded-lg text-xs font-semibold hover:bg-brand-green-light transition-colors">
                            + Agregar talla
                          </button>
                        </div>
                        {selectedSizes.length > 0 && (
                          <p className="text-xs text-brand-green mt-2 font-medium">✓ Tallas activas: {selectedSizes.sort((a,b)=>Number(a)-Number(b)).join(", ")}</p>
                        )}
                      </div>
                    )}

                    {/* Lengths in cm */}
                    {variantType === "largos" && (
                      <div>
                        <p className="text-xs text-gray-400 mb-2">Selecciona los largos disponibles (cm):</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {LENGTH_CM.map(l => (
                            <button key={l} type="button" onClick={() => toggleLength(l)}
                              className={`px-3 h-9 rounded-lg text-xs font-semibold border-2 transition-colors ${selectedLengths.includes(l) ? "bg-brand-green text-white border-brand-green" : "bg-white text-gray-600 border-gray-200 hover:border-brand-green"}`}>
                              {l} cm
                            </button>
                          ))}
                        </div>
                        {/* Custom length input */}
                        <div className="flex gap-2 items-center">
                          <input
                            type="number" value={customLength} onChange={e => setCustomLength(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCustomLength())}
                            placeholder="Otro largo (ej: 42)"
                            className="w-36 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-green transition-colors"
                          />
                          <button type="button" onClick={addCustomLength}
                            className="px-3 py-2 bg-brand-green text-white rounded-lg text-xs font-semibold hover:bg-brand-green-light transition-colors">
                            + Agregar
                          </button>
                        </div>
                        {selectedLengths.length > 0 && (
                          <p className="text-xs text-brand-green mt-2 font-medium">✓ Largos activos: {selectedLengths.sort((a,b)=>Number(a)-Number(b)).join(" cm, ")} cm</p>
                        )}
                      </div>
                    )}
                  </div>


                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={reset} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors">Cancelar</button>
                  {editId && <button type="button" onClick={() => handleDelete(editId, form.name)} disabled={deleteMutation.isPending}
                    className="border border-red-200 text-red-600 px-4 py-3 rounded-xl font-semibold text-sm hover:bg-red-50 transition-colors disabled:opacity-50">
                    {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
                  </button>}
                  <button type="submit" disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1 bg-brand-green text-white py-3 rounded-xl font-semibold text-sm hover:bg-brand-green-light transition-colors disabled:opacity-60">
                    {createMutation.isPending || updateMutation.isPending ? "Guardando..." : editId ? "Guardar Cambios" : "Crear Producto"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

  );
}
