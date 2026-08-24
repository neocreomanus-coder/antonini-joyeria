import { useEffect, useRef, useState } from "react";
import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { ShoppingBag, ChevronLeft, ChevronRight, Shield, Truck, Award, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import ProductCard from "@/components/ProductCard";
import { getDisplayProductPrice, getPopupOfferForProduct } from "@/lib/productPricing";
import { getGalleryImageIndex, getGallerySwipeDirection } from "@/lib/galleryNavigation";
import { buildWhatsAppPurchaseUrl } from "@/lib/whatsappPurchase";
import { getMaterialOption } from "@/lib/materialOptions";
import { getProductTrustMessages } from "@/lib/productGuarantee";
import { PRODUCT_IMAGE_DISCLAIMER_LINES, shouldShowProductImageDisclaimer } from "@/lib/productImageDisclaimer";

function formatPrice(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);
}

function WhatsAppLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className} fill="currentColor">
      <path d="M16 3a13 13 0 0 0-11.2 19.6L3 29l6.6-1.7A13 13 0 1 0 16 3Zm0 23.7c-2 0-4-.5-5.8-1.6l-.4-.2-3.9 1 1-3.8-.3-.4A10.7 10.7 0 1 1 16 26.7Zm5.9-8c-.3-.2-1.8-.9-2-.9-.3-.1-.5-.1-.7.2l-.9 1.1c-.2.2-.4.3-.7.1-1.9-.9-3.2-2.3-4.1-4.1-.2-.3 0-.5.1-.7l.5-.6c.2-.2.2-.4.3-.6 0-.2 0-.5-.1-.6l-.9-2.1c-.2-.5-.5-.4-.7-.4h-.6c-.3 0-.6.1-.8.4-.9.9-1.3 2.1-1.3 3.4 0 .8.2 1.6.5 2.4.4 1 1.1 2 2 2.9 1.4 1.5 3.2 2.7 5.2 3.3.6.2 1.2.3 1.8.3.7 0 1.4-.1 2-.4.2-.1.5-.2.7-.4.3-.4.5-1 .5-1.5 0-.3-.1-.5-.4-.7Z" />
    </svg>
  );
}

export default function Producto() {
  const [, params] = useRoute("/producto/:slug");
  const slug = params?.slug ?? "";
  const { data: product, isLoading } = trpc.products.getBySlug.useQuery({ slug }, { enabled: !!slug });
  const { data: popupConfig } = trpc.siteConfig.getPopup.useQuery(undefined, { refetchOnWindowFocus: false });
  const { addItem, itemCount } = useCart();
  const [selectedVariant, setSelectedVariant] = useState<number | undefined>();
  const [currentImage, setCurrentImage] = useState(0);
  const [adding, setAdding] = useState(false);
  const [pointerStartX, setPointerStartX] = useState<number | null>(null);
  const [mobileControlsVisible, setMobileControlsVisible] = useState(false);
  const mobileControlsTimer = useRef<number | null>(null);
  const touchSwipeHandledRef = useRef(false);

  const showMobileControls = () => {
    setMobileControlsVisible(true);
    if (mobileControlsTimer.current) window.clearTimeout(mobileControlsTimer.current);
    mobileControlsTimer.current = window.setTimeout(() => setMobileControlsVisible(false), 1800);
  };

  useEffect(() => () => {
    if (mobileControlsTimer.current) window.clearTimeout(mobileControlsTimer.current);
  }, []);

  const { data: related = [] } = trpc.products.list.useQuery(
    { categoryId: product?.categoryId, limit: 4 },
    { enabled: !!product?.categoryId }
  );

  const handleAddToCart = async () => {
    if (!product) return;
    const sizeVariants = product.variants?.filter(v => v.type === "size" || v.type === "length") ?? [];
    if (sizeVariants.length > 0 && !selectedVariant) {
      toast.error("Por favor selecciona una talla o largo");
      return;
    }
    setAdding(true);
    await addItem(product.id, selectedVariant);
    setAdding(false);
    toast.success("Producto agregado al carrito");
  };

  if (isLoading) return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-12">
        <div className="grid md:grid-cols-2 gap-12 animate-pulse">
          <div className="aspect-square bg-gold-100 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 bg-gold-100 rounded w-3/4" />
            <div className="h-4 bg-gold-100 rounded w-1/2" />
            <div className="h-10 bg-gold-100 rounded w-1/3" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );

  if (!product) return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-20 text-center">
        <p className="font-sans text-2xl text-gray-700">Producto no encontrado</p>
        <Link href="/catalogo"><Button className="mt-4">Ver catálogo</Button></Link>
      </main>
      <Footer />
    </div>
  );

  const images = (product.imageUrls as string[] | null) ?? [];
  const basePrice = parseFloat(product.basePrice);
  const selectedVariantData = product.variants?.find(v => v.id === selectedVariant);
  const variantModifier = parseFloat(selectedVariantData?.priceModifier ?? "0");
  const finalPrice = basePrice + variantModifier;
  const { price: popupOfferPrice, discountPercent: popupDiscountPercent } = getPopupOfferForProduct(product.id, finalPrice, popupConfig);
  const configuredOriginalPrice = parseFloat(product.originalPrice ?? "0");
  const originalWithVariant = configuredOriginalPrice > basePrice ? configuredOriginalPrice + variantModifier : undefined;
  const popupCompareAtPrice = popupDiscountPercent > 0 ? Math.max(finalPrice, originalWithVariant ?? 0) : originalWithVariant;
  const { discountedPrice, compareAtPrice, hasDiscount } = getDisplayProductPrice(popupOfferPrice, popupCompareAtPrice, 0);
  const sizeVariants = product.variants?.filter(v => v.type === "size") ?? [];
  const lengthVariants = product.variants?.filter(v => v.type === "length") ?? [];
  const selectedOption = selectedVariantData
    ? `${selectedVariantData.type === "size" ? "talla" : "largo"} ${selectedVariantData.value}`
    : undefined;
  const whatsappPurchaseUrl = buildWhatsAppPurchaseUrl({
    productName: product.name,
    priceLabel: formatPrice(discountedPrice),
    reference: product.reference,
    selectedOption,
  });
  const materials = product.materials?.length ? product.materials : [product.material ?? "ORO 18K NACIONAL"];
  const materialOptions = materials.map((value) => getMaterialOption(value));
  const trustItems = getProductTrustMessages(materials, product.categorySlug).map((item) => ({
    ...item,
    icon: item.id === "free-shipping" || item.id === "cash-on-delivery"
      ? Truck
      : item.id === "original-box"
        ? PackageCheck
        : item.id === "fragrance-imported-original" || item.id === "authenticity-certificate"
          ? Award
          : Shield,
  }));

  const completeTouchGesture = (endX: number) => {
    if (pointerStartX === null) return;
    const direction = getGallerySwipeDirection(pointerStartX, endX);
    if (direction && images.length > 1) {
      setCurrentImage((index) => getGalleryImageIndex(index, images.length, direction));
    }
    setPointerStartX(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-20 md:pt-24">
        {/* Breadcrumb */}
        <div className="container py-4 text-sm text-gray-500">
          <Link href="/" className="hover:text-brand-green">Inicio</Link>
          <span className="mx-2">/</span>
          <Link href="/catalogo" className="hover:text-brand-green">Catálogo</Link>
          {product.categoryName && <>
            <span className="mx-2">/</span>
            <Link href={`/catalogo/${product.categorySlug}`} className="hover:text-brand-green">{product.categoryName}</Link>
          </>}
          <span className="mx-2">/</span>
          <span className="text-[oklch(0.18_0.02_60)]">{product.name}</span>
        </div>

        <div className="container py-8">
          <div className="grid gap-10 md:grid-cols-2 md:gap-14 lg:gap-20">
            {/* Gallery */}
            <div>
              <div className="relative mb-3 md:px-11">
                <div
                  className="aspect-square touch-pan-y select-none overflow-hidden rounded-none bg-green-50 md:rounded-2xl"
                  onPointerDown={(event) => {
                    setPointerStartX(event.clientX);
                    showMobileControls();
                  }}
                  onTouchStart={(event) => {
                    const touch = event.touches[0];
                    if (touch) setPointerStartX(touch.clientX);
                    touchSwipeHandledRef.current = false;
                    showMobileControls();
                  }}
                  onPointerUp={(event) => {
                    if (event.pointerType !== "touch") return;
                    touchSwipeHandledRef.current = true;
                    completeTouchGesture(event.clientX);
                  }}
                  onTouchMove={() => showMobileControls()}
                  onTouchEnd={(event) => {
                    if (touchSwipeHandledRef.current) {
                      touchSwipeHandledRef.current = false;
                      return;
                    }
                    const touch = event.changedTouches[0];
                    if (touch) completeTouchGesture(touch.clientX);
                  }}
                  onPointerCancel={() => {
                    touchSwipeHandledRef.current = false;
                    setPointerStartX(null);
                  }}
                  onTouchCancel={() => {
                    touchSwipeHandledRef.current = false;
                    setPointerStartX(null);
                  }}
                  onClick={showMobileControls}
                >
                  {images[currentImage] ? (
                    <img src={images[currentImage]} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-20 h-20 text-gold-300" /></div>
                  )}
                </div>
                {images.length > 1 && <>
                  <button type="button" aria-label="Ver imagen anterior" onClick={() => setCurrentImage(p => getGalleryImageIndex(p, images.length, "previous"))}
                    className="absolute left-0 top-1/2 hidden h-14 w-10 -translate-y-1/2 items-center justify-center rounded-xl border border-[#d6b45f] bg-[linear-gradient(145deg,#fffdf6_0%,#f5e2ad_100%)] text-[#8c5c0b] shadow-[0_8px_18px_rgba(144,98,14,0.2)] transition-all hover:-translate-y-1/2 hover:scale-105 hover:bg-[linear-gradient(145deg,#fff5cd_0%,#deb75b_100%)] hover:text-[#3f2704] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green active:scale-95 md:flex">
                    <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                  <button type="button" aria-label="Ver imagen siguiente" onClick={() => setCurrentImage(p => getGalleryImageIndex(p, images.length, "next"))}
                    className="absolute right-0 top-1/2 hidden h-14 w-10 -translate-y-1/2 items-center justify-center rounded-xl border border-[#d6b45f] bg-[linear-gradient(145deg,#fffdf6_0%,#f5e2ad_100%)] text-[#8c5c0b] shadow-[0_8px_18px_rgba(144,98,14,0.2)] transition-all hover:-translate-y-1/2 hover:scale-105 hover:bg-[linear-gradient(145deg,#fff5cd_0%,#deb75b_100%)] hover:text-[#3f2704] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green active:scale-95 md:flex">
                    <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                  <button type="button" aria-label="Ver imagen anterior en móvil" onClick={() => {
                    setCurrentImage(p => getGalleryImageIndex(p, images.length, "previous"));
                    showMobileControls();
                  }}
                    className={`absolute left-3 top-1/2 z-20 flex h-12 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#e6c76d] bg-[#0D3B2E]/90 text-[#ffe7a2] shadow-[0_8px_20px_rgba(0,0,0,0.35)] backdrop-blur-sm transition-all duration-200 md:hidden ${mobileControlsVisible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}>
                    <ChevronLeft className="h-4 w-4" strokeWidth={1.7} />
                  </button>
                  <button type="button" aria-label="Ver imagen siguiente en móvil" onClick={() => {
                    setCurrentImage(p => getGalleryImageIndex(p, images.length, "next"));
                    showMobileControls();
                  }}
                    className={`absolute right-3 top-1/2 z-20 flex h-12 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#e6c76d] bg-[#0D3B2E]/90 text-[#ffe7a2] shadow-[0_8px_20px_rgba(0,0,0,0.35)] backdrop-blur-sm transition-all duration-200 md:hidden ${mobileControlsVisible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}>
                    <ChevronRight className="h-4 w-4" strokeWidth={1.7} />
                  </button>
                </>}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto px-4 py-1 md:px-11">
                  {images.map((img, i) => (
                    <button key={i} type="button" onClick={() => setCurrentImage(i)}
                      className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-colors md:h-16 md:w-16 ${i === currentImage ? "border-brand-green" : "border-gold-200"}`}>
                      <img src={img} alt={`Vista ${i + 1} de ${product.name}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
              {shouldShowProductImageDisclaimer(product.categorySlug) && (
                <div className="mt-5 px-1 text-left text-[14px] leading-[1.38] text-[#5d5d5d] sm:px-2">
                  <p>Imagen de referencia</p>
                  <p className="mt-1">
                    {PRODUCT_IMAGE_DISCLAIMER_LINES.map((line) => <span key={line} className="block">{line}</span>)}
                  </p>
                </div>
              )}
            </div>

            {/* Información y compra — jerarquía editorial */}
            <div className="mx-auto w-full max-w-xl md:pt-2">
              <div className="mb-3 flex flex-wrap gap-2" aria-label="Materiales disponibles">
                {materialOptions.map((option) => (
                  <span key={option.value} className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-green">
                    <span className={`block h-3 w-3 rounded-full border border-black/10 ${option.swatchClass}`} />
                    {option.label}
                  </span>
                ))}
              </div>
              <h1 className="mb-5 font-sans text-3xl font-bold leading-[1.08] tracking-[-0.025em] text-gray-950 md:text-4xl">{product.name}</h1>
              {product.reference && <p className="-mt-2 mb-5 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Referencia: {product.reference}</p>}
              <div className="border-b border-gray-200 pb-6">
                <p className="font-sans text-[2.15rem] font-semibold leading-none tracking-[-0.035em] text-gray-950 md:text-4xl">{formatPrice(discountedPrice)}</p>
                {hasDiscount && (
                  <p className="mt-2 text-sm font-medium text-gray-400 line-through decoration-gray-400">{formatPrice(compareAtPrice)}</p>
                )}
                {popupDiscountPercent > 0 && <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-brand-green">Oferta activa del popup · {popupDiscountPercent}% OFF</p>}
              </div>

              {/* Size variants */}
              {sizeVariants.length > 0 && (
                <div className="mb-5 pt-6">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-800">Talla</p>
                  <div className="flex flex-wrap gap-2">
                    {sizeVariants.map(v => (
                      <button key={v.id} onClick={() => setSelectedVariant(v.id)}
                        className={`min-w-12 border px-4 py-2.5 text-sm font-semibold transition-colors ${
                          selectedVariant === v.id
                            ? "border-gray-950 bg-gray-950 text-white"
                            : "border-gray-300 bg-white text-gray-800 hover:border-gray-950"
                        }`}>
                        {v.value}
                        {parseFloat(v.priceModifier ?? "0") > 0 && <span className="ml-1 text-xs opacity-70">+{formatPrice(parseFloat(v.priceModifier ?? "0"))}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Length variants */}
              {lengthVariants.length > 0 && (
                <div className={`mb-5 ${sizeVariants.length > 0 ? "pt-1" : "pt-6"}`}>
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-800">Largo</p>
                  <div className="flex flex-wrap gap-2">
                    {lengthVariants.map(v => (
                      <button key={v.id} onClick={() => setSelectedVariant(v.id)}
                        className={`min-w-14 border px-4 py-2.5 text-sm font-semibold transition-colors ${
                          selectedVariant === v.id
                            ? "border-gray-950 bg-gray-950 text-white"
                            : "border-gray-300 bg-white text-gray-800 hover:border-gray-950"
                        }`}>
                        {v.value}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className={`${sizeVariants.length > 0 || lengthVariants.length > 0 ? "mt-8" : "mt-7"}`}>
              <Button onClick={handleAddToCart} disabled={adding} size="lg"
                className="h-14 w-full rounded-none bg-gray-950 text-[12px] font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-brand-green">
                <ShoppingBag className="mr-2 h-[18px] w-[18px]" />
                {adding ? "Agregando..." : "Compra con descuento"}
              </Button>
              <a
                href={whatsappPurchaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex h-14 w-full items-center justify-center gap-2 bg-[#25D366] px-4 text-[12px] font-bold uppercase tracking-[0.055em] text-white shadow-[0_8px_18px_rgba(37,211,102,0.22)] transition-colors hover:bg-[#1ebe5d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#128c4b] focus-visible:ring-offset-2"
              >
                <WhatsAppLogo className="h-5 w-5" />
                Comprar por WhatsApp · Envío gratis
              </a>
              </div>

              {/* Guarantees */}
              <div className="mt-7 grid grid-cols-3 border-y border-gray-200 bg-white">
                {trustItems.map(({ id, icon: Icon, text }) => (
                  <div key={id} className="flex min-h-[96px] flex-col items-center justify-center gap-2 border-l border-gray-200 bg-white px-2 py-4 text-center first:border-l-0 sm:px-3">
                    <Icon className="h-[18px] w-[18px] text-brand-gold" strokeWidth={1.5} />
                    <span className="text-[10px] font-bold uppercase leading-tight tracking-[0.055em] text-gray-800 sm:text-[11px]">{text}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-3 text-[14px] leading-relaxed text-gray-800">
                <p>
                  Disponible para entrega: <span className="font-medium">Todo el país</span>{" "}
                  <Link href="/terminos-y-condiciones" className="font-medium text-brand-gold underline decoration-brand-gold underline-offset-2 transition-colors hover:text-brand-green">
                    Aplican condiciones y restricciones.
                  </Link>
                </p>
                <p>
                  Conoce nuestra política de{" "}
                  <Link href="/cambios-y-devoluciones" className="font-medium text-brand-gold underline decoration-brand-gold underline-offset-2 transition-colors hover:text-brand-green">
                    Cambios y Devoluciones.
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Related products */}
          {related.filter(r => r.id !== product.id).length > 0 && (
            <div className="mt-16">
              <h2 className="font-sans text-2xl font-bold text-[oklch(0.18_0.02_60)] mb-6">Productos relacionados</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {related.filter(r => r.id !== product.id).slice(0, 4).map(p => <ProductCard key={p.id} {...p} />)}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
