import { useCart } from "@/contexts/CartContext";
import { X, ShoppingBag, Minus, Plus, Trash2, Gem, Lock, Tag, ChevronRight } from "lucide-react";
import { Link } from "wouter";

function fmt(n: number) {
  return `$ ${n.toLocaleString("es-CO")}`;
}

function getDiscountPct(itemCount: number) {
  if (itemCount >= 4) return 15;
  if (itemCount >= 3) return 10;
  if (itemCount >= 2) return 5;
  return 0;
}

function getNextDiscount(itemCount: number) {
  if (itemCount >= 4) return null;
  if (itemCount >= 3) return { need: 4 - itemCount, pct: 15 };
  if (itemCount >= 2) return { need: 3 - itemCount, pct: 10 };
  return { need: 2 - itemCount, pct: 5 };
}

export default function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, subtotal, itemCount } = useCart();

  const discountPct = getDiscountPct(itemCount);
  const discountAmount = subtotal * (discountPct / 100);
  const finalTotal = subtotal - discountAmount;
  const nextDiscount = getNextDiscount(itemCount);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm" onClick={closeCart} />
      )}

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white z-[70] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}>

        {/* Header */}
        <div className="flex min-h-16 items-center justify-between gap-3 bg-brand-green px-4 py-3 text-white sm:px-5 sm:py-4 flex-shrink-0">
          <div className="flex min-w-0 items-center gap-2.5">
            <ShoppingBag size={20} className="shrink-0" />
            <span className="whitespace-nowrap font-sans text-lg font-semibold">Mi Carrito</span>
            {itemCount > 0 && (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-gold text-xs font-bold leading-none text-white">
                {itemCount}
              </span>
            )}
          </div>
          <button onClick={closeCart} className="shrink-0 rounded-lg p-1.5 transition-colors hover:bg-white/10" aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        {/* Discount progress bar */}
        {itemCount > 0 && (
          <div className="border-b border-brand-green/10 bg-brand-green/5 px-4 py-3 sm:px-5 flex-shrink-0">
            {discountPct > 0 ? (
              <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-2">
                <Tag size={14} className="text-brand-green flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold leading-snug text-brand-green">
                    ¡Tienes {discountPct}% de descuento aplicado!
                  </p>
                  {nextDiscount && (
                    <p className="mt-0.5 text-[10px] leading-snug text-gray-500">
                      Agrega {nextDiscount.need} más y ahorra {nextDiscount.pct}%
                    </p>
                  )}
                </div>
                <span className="shrink-0 rounded-full bg-brand-green px-2 py-0.5 text-xs font-bold text-white">
                  -{discountPct}%
                </span>
              </div>
            ) : nextDiscount ? (
              <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-2">
                <Tag size={14} className="text-brand-gold flex-shrink-0" />
                <p className="min-w-0 text-xs leading-snug text-gray-600">
                  Agrega <span className="font-bold text-brand-green">{nextDiscount.need} producto más</span> y obtén <span className="font-bold text-brand-green">{nextDiscount.pct}% OFF</span>
                </p>
              </div>
            ) : null}
            {/* Progress bar */}
            <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-green to-brand-gold rounded-full transition-all duration-500"
                style={{ width: `${Math.min((itemCount / 4) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-gray-400 mt-1">
              <span>1 pieza</span>
              <span className={itemCount >= 2 ? "text-brand-green font-bold" : ""}>2 → 5%</span>
              <span className={itemCount >= 3 ? "text-brand-green font-bold" : ""}>3 → 10%</span>
              <span className={itemCount >= 4 ? "text-brand-green font-bold" : ""}>4+ → 15%</span>
            </div>
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto py-4 px-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-4 border-2 border-dashed border-gray-200">
                <ShoppingBag size={30} className="text-gray-300" />
              </div>
              <p className="font-sans text-lg font-semibold text-gray-700 mb-1">Tu carrito está vacío</p>
              <p className="text-sm text-gray-400 mb-6">Agrega joyas para comenzar</p>
              <Link href="/catalogo" onClick={closeCart}
                className="bg-brand-green text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-brand-green-light transition-colors">
                Ver Catálogo
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map(item => {
                const base = parseFloat(item.productBasePrice ?? "0");
                const mod = parseFloat(item.variantPriceModifier ?? "0");
                const unitPrice = base + mod;
                const lineTotal = unitPrice * item.quantity;
                const imgs = item.productImageUrls ?? [];

                return (
                  <div key={item.id} className="flex gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 bg-white transition-colors">
                    {/* Image */}
                    <Link href={`/producto/${item.productSlug}`} onClick={closeCart} className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                        {imgs[0]
                          ? <img src={imgs[0]} alt={item.productName ?? ""} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><Gem size={18} className="text-gray-300" /></div>}
                      </div>
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link href={`/producto/${item.productSlug}`} onClick={closeCart}>
                        <p className="text-sm font-semibold text-gray-800 leading-tight line-clamp-2 hover:text-brand-green transition-colors">
                          {item.productName}
                        </p>
                      </Link>
                      {item.variantValue && (
                        <p className="text-[10px] text-gray-400 mt-0.5 capitalize">{item.variantType}: {item.variantValue}</p>
                      )}
                      <p className="text-[10px] font-bold text-brand-gold mt-0.5">{item.productMaterial || "ORO 18K"}</p>

                      <div className="flex items-center justify-between mt-2">
                        {/* Qty controls */}
                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-gray-50 text-gray-500 transition-colors active:bg-gray-100">
                            <Minus size={11} />
                          </button>
                          <span className="w-7 text-center text-sm font-bold text-gray-800">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-gray-50 text-gray-500 transition-colors active:bg-gray-100">
                            <Plus size={11} />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-brand-green">{fmt(lineTotal)}</span>
                          <button onClick={() => removeItem(item.id)}
                            className="p-1 text-gray-300 hover:text-red-400 transition-colors active:scale-95"
                            aria-label="Eliminar">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with totals */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-4 space-y-3 bg-white flex-shrink-0">
            {/* Subtotal */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal ({itemCount} {itemCount === 1 ? "producto" : "productos"})</span>
                <span>{fmt(subtotal)}</span>
              </div>

              {/* Discount line */}
              {discountPct > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-brand-green font-semibold flex items-center gap-1">
                    <Tag size={12} /> Descuento {discountPct}%
                  </span>
                  <span className="text-brand-green font-bold">-{fmt(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm text-gray-500">
                <span>Envío</span>
                <span className="text-green-600 font-semibold">Gratis</span>
              </div>

              <div className="flex justify-between font-bold text-base text-gray-900 pt-1.5 border-t border-gray-100">
                <span>Total</span>
                <div className="text-right">
                  <span className="text-brand-green text-lg font-sans">{fmt(finalTotal)}</span>
                  {discountPct > 0 && (
                    <p className="text-[10px] text-gray-400 line-through">{fmt(subtotal)}</p>
                  )}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 text-center">Envío gratis a todo Colombia · Pago al recibir</p>

            <Link href="/checkout" onClick={closeCart}
              className="flex items-center justify-center gap-2 w-full bg-brand-green text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-brand-green-light transition-colors shadow-md active:scale-[0.98]">
              <Lock size={15} />
              Finalizar Pedido · {fmt(finalTotal)}
            </Link>

            <Link href="/catalogo" onClick={closeCart}
              className="flex items-center justify-center gap-1 w-full border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:border-brand-green hover:text-brand-green transition-colors">
              Seguir comprando <ChevronRight size={14} />
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
