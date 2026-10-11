import { INVENTORY_ENFORCED } from "@/lib/inventorySettings";
import { useState } from "react";
import { Link } from "wouter";
import { ShoppingBag, Gem } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { getMaterialOption } from "@/lib/materialOptions";
import { trpc } from "@/lib/trpc";
import { getPopupOfferForProduct } from "@/lib/productPricing";

type Props = {
  id: number;
  name: string;
  slug: string;
  material?: string | null;
  customStoneName?: string | null;
  customStoneColor?: string | null;
  basePrice: string;
  originalPrice?: string | number | null;
  imageUrls?: string[] | null;
  categoryName?: string | null;
  volumeMl?: number | null;
  gender?: "masculino" | "femenino" | "unisex" | "ninos" | null;
  perfumeryStyle?: "arabe" | null;
  stock?: number | null;
  variants?: Array<{ id: number; type: string; stock: number | null }>;
};

function fmt(n: string | number) {
  return `$ ${Number(n).toLocaleString("es-CO")}`;
}

const GENDER_LABELS = {
  masculino: "Masculino",
  femenino: "Femenino",
  unisex: "Unisex",
  ninos: "Niños",
} as const;

export default function ProductCard({ id, name, slug, material, customStoneName, customStoneColor, basePrice, originalPrice, imageUrls, volumeMl, gender, perfumeryStyle, stock, variants }: Props) {
  const { addItem } = useCart();
  const { data: popupConfig } = trpc.siteConfig.getPopup.useQuery(undefined, { refetchOnWindowFocus: false });
  const [adding, setAdding] = useState(false);
  const img = imageUrls?.[0] ?? "";
  const regularPrice = Number(basePrice);
  const { price, discountPercent: popupDiscountPercent } = getPopupOfferForProduct(id, regularPrice, popupConfig);
  const configuredOriginalPrice = Number(originalPrice ?? 0);
  const compareAtPrice = popupDiscountPercent > 0 ? Math.max(configuredOriginalPrice, regularPrice) : configuredOriginalPrice;
  const hasDiscount = compareAtPrice > price;
  const materialLabel = [getMaterialOption(material).label, customStoneName].filter(Boolean).join(" · ");
  const productSegment = [perfumeryStyle === "arabe" ? "Árabe" : null, gender ? GENDER_LABELS[gender] : null].filter(Boolean).join(" · ") || null;
  const outOfStock = INVENTORY_ENFORCED && Number(stock ?? 0) <= 0;
  const requiresVariant = Boolean(variants?.some((variant) => variant.type === "size" || variant.type === "length"));

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock || requiresVariant) return;
    setAdding(true);
    try {
      await addItem(id, undefined, 1);
    } finally {
      setTimeout(() => setAdding(false), 800);
    }
  };

  return (
    <Link href={`/producto/${slug}`} className="group block bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {img ? (
          <img src={img} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-200">
            <Gem size={40} />
          </div>
        )}
        {outOfStock && <span className="absolute left-3 top-3 rounded-full bg-gray-950 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">Agotado</span>}
        <button onClick={handleAdd} disabled={outOfStock || requiresVariant}
          className="absolute bottom-3 right-3 bg-brand-green text-white p-2.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 hover:bg-brand-green-light disabled:cursor-not-allowed disabled:bg-gray-300"
          aria-label={outOfStock ? "Producto agotado" : requiresVariant ? "Selecciona una variante en la ficha" : "Agregar al carrito"}>
          {adding
            ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin block" />
            : <ShoppingBag size={16} />}
        </button>
      </div>
      <div className="p-4">
        <p className="mb-1 text-xs font-bold leading-tight tracking-[0.08em] uppercase text-brand-gold">
          {customStoneName && <span className="mr-1.5 inline-block h-2 w-2 rounded-full border border-black/10 align-middle" style={{ backgroundColor: customStoneColor ?? "#7c3aed" }} />}
          {materialLabel}{productSegment ? ` · ${productSegment}` : ""}{volumeMl ? ` · ${volumeMl} ml` : ""}
        </p>
        <p className="text-[17px] font-bold text-gray-950 leading-snug line-clamp-2 font-sans">{name}</p>
        <div className="mt-2.5 min-h-12">
          <p className="text-xl font-extrabold leading-none text-gray-950">{fmt(price)}</p>
          {hasDiscount && <p className="mt-1.5 text-sm font-semibold leading-none text-gray-500 line-through decoration-gray-400">Antes: {fmt(compareAtPrice)}</p>}
          {popupDiscountPercent > 0 && <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-brand-green">Oferta activa · {popupDiscountPercent}% OFF</p>}
        </div>
      </div>
    </Link>
  );
}
