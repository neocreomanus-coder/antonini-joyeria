import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Plus, Edit2, Trash2, Tag, X } from "lucide-react";
import { toast } from "sonner";

function slugify(s: string) { return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

export default function AdminCategories() {
  const utils = trpc.useUtils();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "", sortOrder: "0" });

  const { data: categories = [], isLoading } = trpc.categories.listAll.useQuery();
  const createMutation = trpc.categories.create.useMutation({ onSuccess: () => { toast.success("Categoría creada"); utils.categories.listAll.invalidate(); reset(); } });
  const updateMutation = trpc.categories.update.useMutation({ onSuccess: () => { toast.success("Actualizada"); utils.categories.listAll.invalidate(); reset(); } });
  const deleteMutation = trpc.categories.delete.useMutation({ onSuccess: () => { toast.success("Eliminada"); utils.categories.listAll.invalidate(); } });

  const reset = () => { setShowForm(false); setEditId(null); setForm({ name: "", slug: "", description: "", sortOrder: "0" }); };
  const openEdit = (c: any) => { setEditId(c.id); setForm({ name: c.name, slug: c.slug, description: c.description ?? "", sortOrder: String(c.sortOrder ?? 0) }); setShowForm(true); };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { name: form.name, slug: form.slug, description: form.description || undefined, sortOrder: parseInt(form.sortOrder) || 0 };
    if (editId) updateMutation.mutate({ id: editId, ...data });
    else createMutation.mutate(data);
  };

  return (

      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-sans font-bold text-gray-900">Categorías</h1>
            <p className="text-gray-500 text-sm mt-1">{categories.length} categorías configuradas</p>
          </div>
          <button onClick={() => { reset(); setShowForm(true); }} className="flex items-center gap-2 bg-brand-green text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-brand-green-light transition-colors shadow-sm">
            <Plus size={18} /> Nueva Categoría
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array(8).fill(0).map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((c: any) => (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center mb-3">
                  <Tag size={18} className="text-brand-green" />
                </div>
                <p className="font-sans font-bold text-gray-900 mb-0.5">{c.name}</p>
                <p className="text-xs text-gray-400 font-mono mb-3">/{c.slug}</p>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(c)} className="flex-1 flex items-center justify-center gap-1 border border-gray-200 text-gray-600 py-1.5 rounded-lg text-xs font-medium hover:border-brand-green hover:text-brand-green transition-colors">
                    <Edit2 size={11} /> Editar
                  </button>
                  <button onClick={() => { if (confirm(`¿Eliminar "${c.name}"?`)) deleteMutation.mutate({ id: c.id }); }}
                    className="p-1.5 border border-gray-200 text-gray-400 rounded-lg hover:border-red-300 hover:text-red-400 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between p-5 bg-brand-green text-white rounded-t-2xl">
                <h2 className="font-sans font-bold">{editId ? "Editar Categoría" : "Nueva Categoría"}</h2>
                <button onClick={reset} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"><X size={18} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {[
                  { key: "name", label: "Nombre *", placeholder: "Cadenas", autoSlug: true },
                  { key: "slug", label: "Slug (URL)", placeholder: "cadenas", autoSlug: false },
                  { key: "description", label: "Descripción", placeholder: "Descripción de la categoría", autoSlug: false },
                  { key: "sortOrder", label: "Orden de visualización", placeholder: "0", autoSlug: false },
                ].map(({ key, label, placeholder, autoSlug }) => (
                  <div key={key}>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
                    <input value={(form as any)[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value, ...(autoSlug && !editId ? { slug: slugify(e.target.value) } : {}) }))}
                      placeholder={placeholder}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-green transition-colors" />
                  </div>
                ))}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={reset} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors">Cancelar</button>
                  <button type="submit" disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1 bg-brand-green text-white py-3 rounded-xl font-semibold text-sm hover:bg-brand-green-light transition-colors disabled:opacity-60">
                    {createMutation.isPending || updateMutation.isPending ? "Guardando..." : editId ? "Guardar" : "Crear"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

  );
}

