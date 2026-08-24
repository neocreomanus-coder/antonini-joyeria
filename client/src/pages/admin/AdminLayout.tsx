import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { startLogin } from "@/const";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Package, Tag, ShoppingCart, LogOut, Store, ChevronRight, Menu, Video, Sparkles, PanelsTopLeft, Images, BadgePercent } from "lucide-react";
import { LoginPage } from "./login";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/productos", label: "Productos", icon: Package },
  { href: "/admin/categorias", label: "Categorías", icon: Tag },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingCart },
  { href: "/admin/hero", label: "Hero / Video", icon: Video },
  { href: "/admin/promociones", label: "Carrusel Promo", icon: PanelsTopLeft },
  { href: "/admin/entregas", label: "Entregas Seguras", icon: Images },
  { href: "/admin/popup", label: "Popup Oferta", icon: Sparkles },
  { href: "/admin/codigos-promocionales", label: "Códigos Promo", icon: BadgePercent },
];

// ── Sidebar content — defined OUTSIDE the main component to prevent duplication ──
function SidebarContent({
  location,
  user,
  logout,
  onNavClick,
}: {
  location: string;
  user: { name?: string | null; email?: string | null } | null;
  logout: () => void;
  onNavClick?: () => void;
}) {
  return (
    <>
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <img
          src="/manus-storage/antonini-logo-v3_d35b56de.png"
          alt="Antonini Joyería"
          className="h-10 w-auto object-contain"
        />
        <p className="text-[10px] text-white/40 mt-1 font-bold tracking-widest uppercase">Admin Panel</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = location === href || (href !== "/admin" && location.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active ? "bg-brand-green text-white shadow-sm" : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {label}
              {active && <ChevronRight size={14} className="ml-auto" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10 space-y-1">
        <Link
          href="/"
          onClick={onNavClick}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-all text-sm"
        >
          <Store size={16} /> Ver Tienda
        </Link>
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-brand-green flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user?.name?.charAt(0) ?? "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.name ?? "Admin"}</p>
            <p className="text-[10px] text-white/50 truncate">{user?.email ?? ""}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-white/70 hover:bg-white/10 hover:text-red-300 transition-all text-sm w-full"
        >
          <LogOut size={16} /> Cerrar sesión
        </button>
      </div>
    </>
  );
}

// Usar LoginPage desde la carpeta separada

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (!isAuthenticated)
    return <LoginPage />;

  if (user?.role !== "admin")
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center max-w-sm w-full">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔒</span>
          </div>
          <h2 className="font-sans text-xl font-semibold text-gray-900 mb-2">Acceso Restringido</h2>
          <p className="text-sm text-gray-500 mb-6">No tienes permisos de administrador.</p>
          <Link href="/" className="inline-flex items-center gap-2 text-brand-green font-semibold text-sm hover:underline">
            ← Volver a la tienda
          </Link>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gray-50 flex">
      {/* Desktop sidebar — fixed, single instance */}
      <aside className="hidden lg:flex w-64 bg-brand-green text-white flex-col flex-shrink-0 fixed h-full z-40">
        <SidebarContent location={location} user={user} logout={logout} />
      </aside>

      {/* Mobile overlay sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-brand-green text-white flex flex-col shadow-2xl">
            <SidebarContent location={location} user={user} logout={logout} onNavClick={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-brand-green text-white flex items-center justify-between px-4 py-3 shadow-md">
        <button onClick={() => setMobileOpen(true)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
          <Menu size={22} />
        </button>
        <img src="/manus-storage/antonini-logo-v3_d35b56de.png" alt="Antonini" className="h-8 w-auto object-contain" />
        <div className="w-9" />
      </div>

      {/* Main content */}
      <main className="w-full min-w-0 flex-1 lg:ml-64 min-h-screen pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
