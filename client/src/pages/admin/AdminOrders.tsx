import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatOrderNumber } from "@/lib/paymentFlow";
import { Eye, Search, ShoppingCart, ChevronDown } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

function fmt(n: string | number) { return `$ ${Number(n).toLocaleString("es-CO")}`; }

const STATUS: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  pendiente:  { label: "Pendiente",  bg: "bg-green-50",  text: "text-green-700",  dot: "bg-brand-green" },
  despachado: { label: "Despachado", bg: "bg-amber-50",  text: "text-amber-800",  dot: "bg-amber-500" },
  entregado:  { label: "Entregado",  bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-400" },
};
const STATUS_OPTS = ["pendiente", "despachado", "entregado"];

export default function AdminOrders() {
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const { data: orders = [], refetch, isLoading } = trpc.orders.adminList.useQuery({ limit: 100, status: filterStatus || undefined });
  const updateStatus = trpc.orders.updateStatus.useMutation({ onSuccess: () => { toast.success("Estado actualizado"); refetch(); } });

  const filtered = orders.filter((o: any) => {
    if (!search) return true;
    return String(o.id).includes(search) || (o.shippingAddress?.fullName ?? "").toLowerCase().includes(search.toLowerCase());
  });

  return (

      <div className="p-6 md:p-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-sans font-bold text-gray-900">Pedidos</h1>
          <p className="text-gray-500 text-sm mt-1">{orders.length} pedidos en total</p>
        </div>

        <div className="flex flex-wrap gap-3 mb-5">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por ID o nombre..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green transition-colors" />
          </div>
          <div className="relative">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="appearance-none pl-4 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green bg-white">
              <option value="">Todos los estados</option>
              {STATUS_OPTS.map(s => <option key={s} value={s}>{STATUS[s].label}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {["", ...STATUS_OPTS].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${filterStatus === s ? (s ? `${STATUS[s].bg} ${STATUS[s].text} ring-1 ring-current` : "bg-brand-green text-white") : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {s ? STATUS[s].label : "Todos"}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="py-12 text-center"><div className="w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-gray-400"><ShoppingCart size={32} className="mx-auto mb-2 opacity-30" /><p className="text-sm">No hay pedidos</p></div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {["#", "Cliente", "Ciudad", "Total", "Estado", "Fecha", ""].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((order: any) => {
                      const s = STATUS[order.status] ?? STATUS.pendiente;
                      return (
                        <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-4 text-sm font-bold text-brand-green">{formatOrderNumber(order.id)}</td>
                          <td className="px-5 py-4"><p className="text-sm font-semibold text-gray-800">{order.shippingAddress?.fullName ?? order.userName ?? "—"}</p></td>
                          <td className="px-5 py-4 text-xs text-gray-400">{order.shippingAddress?.city ?? "—"}</td>
                          <td className="px-5 py-4 text-sm font-bold text-gray-900">{fmt(parseFloat(order.total))}</td>
                          <td className="px-5 py-4">
                            <select value={order.status} onChange={e => updateStatus.mutate({ id: order.id, status: e.target.value as any })}
                              className={`text-xs font-bold px-3 py-1.5 rounded-full border-0 cursor-pointer focus:outline-none ${s.bg} ${s.text}`}>
                              {STATUS_OPTS.map(st => <option key={st} value={st}>{STATUS[st].label}</option>)}
                            </select>
                          </td>
                          <td className="px-5 py-4 text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString("es-CO")}</td>
                          <td className="px-5 py-4">
                            <Link href={`/admin/pedidos/${order.id}`} className="flex items-center gap-1 text-xs font-semibold text-brand-green hover:underline"><Eye size={14} /> Ver</Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Mobile */}
              <div className="md:hidden divide-y divide-gray-50">
                {filtered.map((order: any) => {
                  const s = STATUS[order.status] ?? STATUS.pendiente;
                  return (
                    <div key={order.id} className="p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-brand-green text-sm">{formatOrderNumber(order.id)}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>{s.label}</span>
                      </div>
                      <p className="font-semibold text-gray-800 text-sm">{order.shippingAddress?.fullName ?? "—"}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-gray-900 text-sm">{fmt(parseFloat(order.total))}</span>
                        <Link href={`/admin/pedidos/${order.id}`} className="text-xs font-semibold text-brand-green flex items-center gap-1"><Eye size={12} /> Ver</Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

  );
}
