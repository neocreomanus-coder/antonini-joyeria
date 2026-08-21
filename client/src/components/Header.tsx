import { useCart } from "@/contexts/CartContext";
import { ShoppingBag, Search, Menu, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";

const CATEGORIES = [
  { name: "Cadenas", slug: "cadenas" },
  { name: "Topos", slug: "topos" },
  { name: "Anillos", slug: "anillos" },
  { name: "Dijes", slug: "dijes" },
  { name: "Pulseras", slug: "pulseras" },
  { name: "Argollas", slug: "argollas" },
  { name: "Perfumería", slug: "perfumeria" },
];

export default function Header() {
  const { itemCount, toggleCart } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [location, navigate] = useLocation();
  const searchRef = useRef<HTMLInputElement>(null);
  const headerIsLight = scrolled || location !== "/";

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalogo?buscar=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
      <>
      {/* Main header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${headerIsLight ? "bg-white shadow-md" : "bg-transparent"}`}>
        <div className="container">
          <div className="flex items-center justify-between h-16 md:h-20">

            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <img
                src="/manus-storage/antonini-logo-v3_d35b56de.png"
                alt="Antonini Joyería"
                className="h-14 md:h-20 w-auto object-contain"
              />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-0.5">
              {CATEGORIES.map(cat => (
                <Link
                  key={cat.slug}
                  href={`/catalogo/${cat.slug}`}
                  className={`relative px-3 py-2 text-[11px] font-semibold tracking-widest uppercase transition-colors group ${headerIsLight ? "text-gray-700 hover:text-brand-green" : "text-white/90 hover:text-white"}`}
                >
                  {cat.name}
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-brand-gold scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
                </Link>
              ))}
              <Link href="/rastrear-pedido" className={`px-3 py-2 text-[11px] font-semibold tracking-widest uppercase transition-colors ${headerIsLight ? "text-gray-700 hover:text-brand-green" : "text-white/90 hover:text-white"}`}>Rastrear pedido</Link>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {/* Search */}
              {searchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center gap-1">
                  <input
                    ref={searchRef}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Buscar joyas..."
                    className="w-36 md:w-48 h-8 border border-gray-200 rounded-md px-3 text-sm focus:outline-none focus:border-brand-green"
                  />
                  <button type="button" onClick={() => setSearchOpen(false)} className="p-1.5 text-gray-500 hover:text-brand-green">
                    <X size={16} />
                  </button>
                </form>
              ) : (
                <button onClick={() => setSearchOpen(true)} className={`p-2 transition-colors ${headerIsLight ? "text-gray-600 hover:text-brand-green" : "text-white hover:text-white/80"}`} aria-label="Buscar">
                  <Search size={20} />
                </button>
              )}

              {/* Cart */}
              <button onClick={toggleCart} className={`relative p-2 transition-colors ${headerIsLight ? "text-gray-600 hover:text-brand-green" : "text-white hover:text-white/80"}`} aria-label="Carrito">
                <ShoppingBag size={20} />
                {itemCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-brand-green text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                )}
              </button>

              {/* Mobile toggle */}
              <button onClick={() => setMobileOpen(p => !p)} className={`lg:hidden p-2 transition-colors ${headerIsLight ? "text-gray-600 hover:text-brand-green" : "text-white hover:text-white/80"}`} aria-label="Menú">
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white">
            <div className="container py-3 grid grid-cols-2 gap-1">
              {CATEGORIES.map(cat => (
                <Link
                  key={cat.slug}
                  href={`/catalogo/${cat.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-brand-green hover:bg-gray-50 rounded-md transition-colors uppercase tracking-wide"
                >
                  {cat.name}
                </Link>
              ))}
              <Link href="/rastrear-pedido" onClick={() => setMobileOpen(false)} className="col-span-2 px-3 py-2.5 text-sm font-semibold text-brand-green hover:bg-gray-50 rounded-md transition-colors uppercase tracking-wide">Rastrear pedido</Link>
            </div>
            {/* Social links in mobile menu */}
            <div className="container pb-4 pt-2 border-t border-gray-100 flex items-center gap-4">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Síguenos:</span>
              <a href="https://www.instagram.com/antoninijoyeriacol?igsh=MXJkcjgzNjMxM216MA==" target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green hover:bg-brand-green hover:text-white transition-all">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="https://www.facebook.com/share/1EgtXWUNXF/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green hover:bg-brand-green hover:text-white transition-all">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="https://www.tiktok.com/@antonini.joyeria?_r=1&_t=ZS-98JNe1fbbBE" target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green hover:bg-brand-green hover:text-white transition-all">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/></svg>
              </a>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
