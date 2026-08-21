import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatOrderNumber } from "@/lib/paymentFlow";
import { Package, ShoppingCart, TrendingUp, Clock, ArrowRight, Eye } from "lucide-react";
import { Link } from "wouter";

function fmt(n: number) {
  return `$ ${n.toLocaleString("es-CO")}`;
}

const STATUS: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  pendiente:   { label: "Pendiente",   bg: "bg-green-50",   text: "text-green-700",  dot: "bg-brand-green" },
  despachado:  { label: "Despachado",  bg: "bg-amber-50",   text: "text-amber-800",  dot: "bg-amber-500" },
  entregado:   { label: "Entregado",   bg: "bg-green-50",   text: "text-green-700",  dot: "bg-green-400" },
};

export default function AdminDashboard() {
  const { data: stats, isLoading } = trpc.admin.stats.useQuery();
  const { data: recentOrders = [] } = trpc.orders.adminList.useQuery({ limit: 6 });

  const STAT_CARDS = [
    { label: "Total Pedidos",     value: stats?.totalOrders ?? 0,                         icon: ShoppingCart, accent: "bg-brand-green/10 text-brand-green",  border: "border-brand-green/20" },
    { label: "Ingresos Totales",  value: fmt(parseFloat(stats?.totalRevenue ?? "0")),      icon: TrendingUp,   accent: "bg-brand-green/10 text-brand-green",     border: "border-brand-green/20" },
    { label: "Pendientes",        value: stats?.pendingOrders ?? 0,                        icon: Clock,        accent: "bg-green-50 text-brand-green",           border: "border-green-200" },
    { label: "Productos Activos", value: stats?.totalProducts ?? 0,                        icon: Package,      accent: "bg-emerald-50 text-emerald-600",       border: "border-emerald-200" },
  ];

  return (

      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-sans font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Bienvenido al panel de administración de Antonini Joyería</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {STAT_CARDS.map(({ label, value, icon: Icon, accent, border }) => (
            <div key={label} className={`bg-white rounded-2xl p-5 border ${border} shadow-sm`}>
              <div className={`w-10 h-10 rounded-xl ${accent} flex items-center justify-center mb-4`}>
                <Icon size={20} />
              </div>
              <p className="text-2xl font-bold text-gray-900 font-sans">{isLoading ? "—" : value}</p>
              <p className="text-xs text-gray-500 mt-1 font-medium">{label}</p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { href: "/admin/productos", label: "Gestionar Productos", sub: "Agregar, editar o desactivar", icon: Package, color: "bg-brand-green" },
            { href: "/admin/pedidos", label: "Ver Pedidos", sub: "Gestionar y actualizar estados", icon: ShoppingCart, color: "bg-brand-green" },
            { href: "/admin/categorias", label: "Categorías", sub: "Organizar el catálogo", icon: TrendingUp, color: "bg-emerald-600" },
          ].map(({ href, label, sub, icon: Icon, color }) => (
            <Link key={href} href={href} className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4">
              <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon size={22} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
              </div>
              <ArrowRight size={16} className="text-gray-300 group-hover:text-brand-green transition-colors flex-shrink-0" />
            </Link>
          ))}
        </div>

        {/* Recent orders */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <div>
              <h2 className="font-sans font-bold text-gray-900">Pedidos Recientes</h2>
              <p className="text-xs text-gray-500 mt-0.5">Últimos {recentOrders.length} pedidos</p>
            </div>
            <Link href="/admin/pedidos" className="text-xs font-bold text-brand-green hover:underline flex items-center gap-1">
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <ShoppingCart size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aún no hay pedidos</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentOrders.map((order: any) => {
                const s = STATUS[order.status] ?? STATUS.pendiente;
                return (
                  <div key={order.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-brand-green/10 flex items-center justify-center flex-shrink-0">
                      <ShoppingCart size={16} className="text-brand-green" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">Pedido {formatOrderNumber(order.id)}</p>
                      <p className="text-xs text-gray-500 truncate">{order.shippingAddress?.fullName ?? "—"}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-brand-green">{fmt(parseFloat(order.total))}</p>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5 ${s.bg} ${s.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {s.label}
                      </span>
                    </div>
                    <Link href={`/admin/pedidos/${order.id}`} className="p-1.5 text-gray-300 hover:text-brand-green transition-colors flex-shrink-0">
                      <Eye size={16} />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

  );
}
