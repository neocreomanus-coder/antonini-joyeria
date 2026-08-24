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
  basePrice: string;
  originalPrice?: string | number | null;
  imageUrls?: string[] | null;
  categoryName?: string | null;
  volumeMl?: number | null;
  gender?: "masculino" | "femenino" | "unisex" | "ninos" | null;
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

export default function ProductCard({ id, name, slug, material, basePrice, originalPrice, imageUrls, volumeMl, gender }: Props) {
  const { addItem } = useCart();
  const { data: popupConfig } = trpc.siteConfig.getPopup.useQuery(undefined, { refetchOnWindowFocus: false });
  const [adding, setAdding] = useState(false);
  const img = imageUrls?.[0] ?? "";
  const regularPrice = Number(basePrice);
  const { price, discountPercent: popupDiscountPercent } = getPopupOfferForProduct(id, regularPrice, popupConfig);
  const configuredOriginalPrice = Number(originalPrice ?? 0);
  const compareAtPrice = popupDiscountPercent > 0 ? Math.max(configuredOriginalPrice, regularPrice) : configuredOriginalPrice;
  const hasDiscount = compareAtPrice > price;
  const materialLabel = getMaterialOption(material).label;
  const productSegment = gender ? GENDER_LABELS[gender] : null;

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAdding(true);
    await addItem(id, undefined, 1);
    setTimeout(() => setAdding(false), 800);
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
        <button onClick={handleAdd}
          className="absolute bottom-3 right-3 bg-brand-green text-white p-2.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 hover:bg-brand-green-light"
          aria-label="Agregar al carrito">
          {adding
            ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin block" />
            : <ShoppingBag size={16} />}
        </button>
      </div>
      <div className="p-4">
        <p className="mb-1 text-xs font-bold leading-tight tracking-[0.08em] uppercase text-brand-gold">
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
