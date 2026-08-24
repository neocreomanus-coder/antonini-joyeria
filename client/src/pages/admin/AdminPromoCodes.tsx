import { useState } from "react";
import { BadgePercent, Check, Pencil, Plus, Power, Save, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type PromoDraft = { code: string; discountPercent: number; active: boolean };

function normalizeCode(value: string) {
  return value.toUpperCase().replace(/\s+/g, "");
}

function PromoCodeRow({ promo }: { promo: { id: number; code: string; discountPercent: number; active: boolean } }) {
  const utils = trpc.useUtils();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PromoDraft>({ code: promo.code, discountPercent: promo.discountPercent, active: promo.active });
  const update = trpc.promoCodes.update.useMutation({
    onSuccess: () => {
      toast.success("Código promocional actualizado");
      utils.promoCodes.adminList.invalidate();
      setEditing(false);
    },
    onError: (error) => toast.error(error.message || "No fue posible actualizar el código"),
  });

  const save = () => update.mutate({ id: promo.id, ...draft, code: normalizeCode(draft.code) });
  const toggle = () => update.mutate({ id: promo.id, active: !promo.active });

  return (
    <div className="grid grid-cols-1 gap-3 border-t border-gray-100 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_110px_auto] sm:items-center">
      <div>
        {editing ? (
          <input value={draft.code} onChange={(e) => setDraft((current) => ({ ...current, code: normalizeCode(e.target.value) }))}
            className="w-full rounded-lg border border-brand-green/40 px-3 py-2 font-mono text-sm font-bold tracking-wide uppercase outline-none focus:border-brand-green" />
        ) : <p className="font-mono text-sm font-bold tracking-wide text-gray-900">{promo.code}</p>}
        <p className={`mt-1 text-xs font-medium ${promo.active ? "text-brand-green" : "text-gray-400"}`}>{promo.active ? "Activo en checkout" : "Inactivo"}</p>
      </div>
      <div>
        {editing ? (
          <input type="number" min={1} max={90} value={draft.discountPercent}
            onChange={(e) => setDraft((current) => ({ ...current, discountPercent: Number(e.target.value) }))}
            className="w-full rounded-lg border border-brand-green/40 px-3 py-2 text-sm font-bold outline-none focus:border-brand-green" />
        ) : <p className="text-lg font-bold text-brand-green">{promo.discountPercent}% <span className="text-xs font-medium text-gray-400">OFF</span></p>}
      </div>
      <div className="flex items-center gap-2">
        {editing ? (
          <>
            <button type="button" onClick={save} disabled={update.isPending} className="rounded-lg bg-brand-green p-2 text-white transition-colors hover:bg-brand-green-light" aria-label="Guardar código"><Save size={16} /></button>
            <button type="button" onClick={() => { setDraft({ code: promo.code, discountPercent: promo.discountPercent, active: promo.active }); setEditing(false); }} className="rounded-lg border border-gray-200 p-2 text-gray-500" aria-label="Cancelar edición"><X size={16} /></button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => setEditing(true)} className="rounded-lg border border-gray-200 p-2 text-gray-600 transition-colors hover:border-brand-gold hover:text-brand-green" aria-label="Editar código"><Pencil size={16} /></button>
            <button type="button" onClick={toggle} disabled={update.isPending} className={`rounded-lg p-2 transition-colors ${promo.active ? "bg-brand-green/10 text-brand-green hover:bg-brand-green hover:text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`} aria-label={promo.active ? "Desactivar código" : "Activar código"}><Power size={16} /></button>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminPromoCodes() {
  const utils = trpc.useUtils();
  const { data: promoCodes = [], isLoading } = trpc.promoCodes.adminList.useQuery();
  const [draft, setDraft] = useState<PromoDraft>({ code: "", discountPercent: 10, active: true });
  const create = trpc.promoCodes.create.useMutation({
    onSuccess: () => {
      toast.success("Código promocional creado");
      utils.promoCodes.adminList.invalidate();
      setDraft({ code: "", discountPercent: 10, active: true });
    },
    onError: (error) => toast.error(error.message || "No fue posible crear el código. Verifica que no esté repetido."),
  });

  const createCode = () => {
    const code = normalizeCode(draft.code);
    if (code.length < 2) { toast.error("Escribe un código de al menos 2 caracteres"); return; }
    if (!Number.isInteger(draft.discountPercent) || draft.discountPercent < 1 || draft.discountPercent > 90) { toast.error("El descuento debe estar entre 1% y 90%"); return; }
    create.mutate({ ...draft, code });
  };

  return (
    <div className="mx-auto max-w-4xl p-5 md:p-6">
      <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-brand-green"><BadgePercent size={20} /><span className="text-xs font-bold uppercase tracking-[0.15em]">Descuentos manuales</span></div>
          <h1 className="mt-2 font-sans text-2xl font-bold text-gray-950">Códigos promocionales</h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-500">Crea códigos con porcentaje fijo. Solo los códigos activos podrán aplicarse y el valor final siempre se recalcula al confirmar el pedido.</p>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-gold/15 px-3 py-1.5 text-xs font-bold text-[#8e6c1e]"><Check size={14} /> Validación segura</span>
      </div>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-[#fbfaf7] px-5 py-4"><h2 className="text-sm font-bold text-gray-900">Crear un código</h2></div>
        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-[minmax(0,1fr)_160px_auto] md:items-end">
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">Código
            <input value={draft.code} onChange={(e) => setDraft((current) => ({ ...current, code: normalizeCode(e.target.value) }))} placeholder="EJ: ANTONINI10" className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 font-mono text-sm font-bold uppercase outline-none focus:border-brand-green" />
          </label>
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">Descuento (%)
            <input type="number" min={1} max={90} value={draft.discountPercent} onChange={(e) => setDraft((current) => ({ ...current, discountPercent: Number(e.target.value) }))} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold outline-none focus:border-brand-green" />
          </label>
          <button type="button" onClick={createCode} disabled={create.isPending} className="flex items-center justify-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-green-light disabled:opacity-60"><Plus size={17} /> Crear código</button>
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4"><h2 className="text-sm font-bold text-gray-900">Códigos creados</h2><span className="text-xs text-gray-400">{promoCodes.length} en total</span></div>
        {isLoading ? <div className="p-8 text-center text-sm text-gray-400">Cargando códigos…</div> : promoCodes.length === 0 ? <div className="p-8 text-center text-sm text-gray-400">Aún no has creado códigos promocionales.</div> : promoCodes.map((promo) => <PromoCodeRow key={promo.id} promo={promo} />)}
      </section>
    </div>
  );
}
