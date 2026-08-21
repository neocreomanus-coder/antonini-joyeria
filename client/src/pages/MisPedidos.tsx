import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { formatOrderNumber } from "@/lib/paymentFlow";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Package, ChevronRight } from "lucide-react";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pendiente: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800" },
  despachado: { label: "Despachado", color: "bg-amber-100 text-amber-800" },
  entregado: { label: "Entregado", color: "bg-green-100 text-green-800" },
};

function formatPrice(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);
}

export default function MisPedidos() {
  const { isAuthenticated, loading } = useAuth();
  const { data: orders = [], isLoading } = trpc.orders.myOrders.useQuery(undefined, { enabled: isAuthenticated });

  if (!loading && !isAuthenticated) return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container pt-24 pb-20 text-center">
        <Package className="w-16 h-16 text-gold-300 mx-auto mb-4" />
        <p className="font-sans text-2xl text-[oklch(0.35_0.02_60)] mb-2">Inicia sesión para ver tus pedidos</p>
        <Button className="mt-4 bg-[oklch(0.62_0.12_75)] text-white" onClick={() => startLogin()}>Iniciar sesión</Button>
      </main>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-[oklch(0.98_0.005_85)] pt-20 md:pt-24">
        <div className="container py-10">
          <h1 className="font-sans text-3xl font-bold text-[oklch(0.18_0.02_60)] mb-8">Mis pedidos</h1>
          {isLoading ? (
            <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-gold-100" />)}</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-16 h-16 text-gold-300 mx-auto mb-4" />
              <p className="font-sans text-2xl text-[oklch(0.35_0.02_60)]">Aún no tienes pedidos</p>
              <Link href="/catalogo"><Button className="mt-4 bg-[oklch(0.62_0.12_75)] text-white">Empezar a comprar</Button></Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => {
                const s = STATUS_LABELS[order.status] ?? STATUS_LABELS.pendiente;
                return (
                  <Link key={order.id} href={`/mis-pedidos/${order.id}`}>
                    <div className="bg-white rounded-2xl p-5 border border-gold-100 hover:border-gold-300 transition-colors cursor-pointer flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gold-50 flex items-center justify-center shrink-0">
                          <Package className="w-6 h-6 text-[oklch(0.62_0.12_75)]" />
                        </div>
                        <div>
                          <p className="font-semibold text-[oklch(0.18_0.02_60)]">Pedido {formatOrderNumber(order.id)}</p>
                          <p className="text-sm text-[oklch(0.52_0.02_60)]">{new Date(order.createdAt).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${s.color}`}>{s.label}</span>
                        <p className="font-sans font-bold text-[oklch(0.48_0.11_70)]">{formatPrice(parseFloat(order.total))}</p>
                        <ChevronRight className="w-4 h-4 text-[oklch(0.52_0.02_60)]" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
