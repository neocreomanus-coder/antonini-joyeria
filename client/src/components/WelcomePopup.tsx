import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { X, Tag, ShoppingBag, Gem, Sparkles } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { shouldHideWelcomePopup } from "@/lib/popupVisibility";

export default function WelcomePopup() {
  const [location] = useLocation();
  const [visible, setVisible] = useState(false);
  const { data: config } = trpc.siteConfig.getPopup.useQuery();
  // Fetch only the configured popup product directly by ID
  const productId = config?.productId;
  const { data: popupProduct } = trpc.products.getById.useQuery(
    { id: productId ?? 0 },
    { enabled: !!productId }
  );

  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);
  const isOperationalFlow = shouldHideWelcomePopup(location);

  useEffect(() => {
    if (!config?.enabled || isOperationalFlow) return;
    // Show popup after 1.5s, only once per session
    const alreadyShown = sessionStorage.getItem("popup_shown");
    if (alreadyShown) return;
    const t = setTimeout(() => {
      setVisible(true);
      sessionStorage.setItem("popup_shown", "1");
    }, 1500);
    return () => clearTimeout(t);
  }, [config?.enabled, isOperationalFlow]);

  const close = () => setVisible(false);

  const handleAdd = async () => {
    if (!popupProduct) return;
    setAdding(true);
    await addItem(popupProduct.id, undefined, 1);
    setTimeout(() => { setAdding(false); close(); }, 800);
  };

  if (!config?.enabled || isOperationalFlow) return null;

  const imgs: string[] = popupProduct && Array.isArray(popupProduct.imageUrls) ? popupProduct.imageUrls : [];
  const originalPrice = popupProduct ? Number(popupProduct.basePrice) : 0;
  const discountedPrice = originalPrice * (1 - (config?.discount ?? 20) / 100);

  return (
    <div
      className={`fixed inset-0 z-[300] flex items-center justify-center p-4 transition-all duration-500 ${visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />

      {/* Modal */}
      <div className={`relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transition-all duration-500 ${visible ? "scale-100 translate-y-0" : "scale-95 translate-y-6"}`}>
        {/* Close button */}
        <button
          onClick={close}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-white transition-colors"
        >
          <X size={16} />
        </button>

        {/* Top banner */}
        <div className="bg-brand-green px-6 py-8 text-white text-center relative overflow-hidden">
          
          <div className="absolute inset-0 opacity-10">
            {[...Array(6)].map((_, i) => (
              <Sparkles key={i} size={20} className="absolute" style={{ top: `${Math.random()*100}%`, left: `${Math.random()*100}%` }} />
            ))}
          </div>
          <div className="relative">
            {/* Logo */}
            <img 
              src="/manus-storage/antonini-logo-v3_d35b56de.png" 
              alt="Antonini" 
              className="h-12 w-auto mx-auto mb-3 object-contain drop-shadow-lg" 
            />
            <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1 mb-2">
              <Tag size={13} />
              <span className="text-xs font-bold tracking-widest uppercase">{config?.subtitle ?? "Solo por hoy"}</span>
            </div>
            <h2 className="text-2xl font-sans font-bold">{config?.title ?? "¡Oferta Especial!"}</h2>
            <div className="mt-2 inline-flex items-center gap-1">
              <span className="text-5xl font-black text-brand-gold">{config?.discount ?? 20}%</span>
              <span className="text-lg font-bold mt-2">OFF</span>
            </div>
            <p className="text-white/80 text-xs mt-1">En el producto seleccionado</p>
          </div>
          {/* Franja OFERTA en la división */}
          <div className="absolute bottom-0 left-0 right-0 h-6 bg-red-600 flex items-center overflow-hidden">
            <div className="flex gap-8 whitespace-nowrap animate-pulse">
              {[...Array(8)].map((_, i) => (
                <span key={i} className="text-white font-black text-xs tracking-widest flex-shrink-0">OFERTA</span>
              ))}
            </div>
          </div>
        </div>

        {/* Product */}
        <div className="p-5">
          {popupProduct ? (
            <div className="flex gap-4 items-center mb-5">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                {imgs[0] ? (
                  <img src={imgs[0]} alt={popupProduct.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Gem size={28} className="text-gray-300" /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-brand-gold uppercase tracking-wide mb-0.5">{popupProduct.material ?? "ORO 18K"}</p>
                <p className="font-sans font-bold text-gray-800 text-sm leading-tight line-clamp-2 mb-2">{popupProduct.name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-brand-green">
                    $ {discountedPrice.toLocaleString("es-CO", { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-sm text-gray-400 line-through">
                    $ {originalPrice.toLocaleString("es-CO")}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 mb-5 p-4 bg-gray-50 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-brand-green/10 flex items-center justify-center">
                <Gem size={22} className="text-brand-green" />
              </div>
              <div>
                <p className="font-bold text-gray-800 text-sm">Joyas de Oro 18K</p>
                <p className="text-xs text-gray-500">Descuento especial en toda la colección</p>
              </div>
            </div>
          )}

          {/* CTA buttons */}
          <div className="flex flex-col gap-2.5">
            {popupProduct ? (
              <button
                onClick={handleAdd}
                disabled={adding}
                className="flex items-center justify-center gap-2 w-full bg-brand-green text-white py-3.5 rounded-xl font-bold text-sm hover:bg-brand-green-light transition-colors shadow-sm active:scale-[0.98] disabled:opacity-70"
              >
                {adding ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ShoppingBag size={16} />
                )}
                {config?.buttonText ?? "Aprovechar oferta"}
              </button>
            ) : (
              <Link
                href="/catalogo"
                onClick={close}
                className="flex items-center justify-center gap-2 w-full bg-brand-green text-white py-3.5 rounded-xl font-bold text-sm hover:bg-brand-green-light transition-colors shadow-sm active:scale-[0.98]"
              >
                <ShoppingBag size={16} />
                {config?.buttonText ?? "Ver colección"}
              </Link>
            )}
            <button
              onClick={close}
              className="w-full border border-gray-200 text-gray-500 py-3 rounded-xl text-sm hover:border-gray-300 hover:text-gray-700 transition-colors"
            >
              No gracias, seguir viendo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
