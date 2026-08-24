import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useCart } from "@/contexts/CartContext";
import { getNextCarouselIndex } from "@/lib/promoCarousel";
import { getDisplayProductPrice, getPopupOfferForProduct } from "@/lib/productPricing";
import { getAssignedJewelryProducts, getAssignedTrendingProducts } from "@/lib/homeSectionFilters";
import { getHomeProductCarouselOffset } from "@/lib/homeProductCarousel";
import { getRenderableTestimonials, getTestimonialWindow } from "@/lib/testimonialCarousel";
import { ShoppingBag, Star, ChevronLeft, ChevronRight, Shield, Truck, Award, Gem, Check, Sparkles, X, Pause, Play } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// ─── Hero Section con Carrusel ─────────────────────────────────────────────────
function HeroSection() {
  const { data: heroConfig } = trpc.siteConfig.getHero.useQuery();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const fallbackImage = heroConfig?.fallbackImage ?? "/manus-storage/hero-antonini-modelo_c203840d.jpg";
  const slides = heroConfig?.slides?.length ? heroConfig.slides : [{ id: "fallback", mediaUrl: fallbackImage, mediaType: "image" as const }];
  const activeSlide = slides[activeIndex % slides.length];
  const showVideo = activeSlide?.mediaType === "video" && !videoError;

  useEffect(() => {
    setActiveIndex(0);
    if (slides.length < 2) return;
    const timer = window.setInterval(() => setActiveIndex(current => getNextCarouselIndex(current, slides.length)), heroConfig?.intervalMs ?? 6500);
    return () => window.clearInterval(timer);
  }, [slides.length, heroConfig?.intervalMs]);

  useEffect(() => {
    setVideoError(false);
    setIsPaused(false);
  }, [activeIndex]);

  const showSlide = (index: number) => setActiveIndex((index + slides.length) % slides.length);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) { videoRef.current.play(); setIsPaused(false); }
      else { videoRef.current.pause(); setIsPaused(true); }
    }
  };

  return (
    <section
      className="relative w-full overflow-hidden bg-gray-900"
      style={{ height: "100svh", minHeight: "500px" }}
      onTouchStart={(event) => { touchStartX.current = event.touches[0]?.clientX ?? null; }}
      onTouchEnd={(event) => {
        const start = touchStartX.current;
        const end = event.changedTouches[0]?.clientX;
        if (start !== null && end !== undefined && Math.abs(end - start) > 45 && slides.length > 1) showSlide(end < start ? activeIndex + 1 : activeIndex - 1);
        touchStartX.current = null;
      }}
    >
      {/* ── Video o imagen de fondo — ocupa exactamente 100vh ── */}
      {showVideo ? (
        <video
          ref={videoRef}
          key={activeSlide.id}
          src={activeSlide.mediaUrl}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onError={() => setVideoError(true)}
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
      ) : (
        <img
          key={activeSlide.id}
          src={activeSlide?.mediaUrl ?? fallbackImage}
          alt="Antonini Joyería"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
      )}

      {/* ── Overlay — gradiente inferior para legibilidad del texto ── */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-black/30" />

      {slides.length > 1 && (
        <>
          <button type="button" onClick={() => showSlide(activeIndex - 1)} aria-label="Diapositiva anterior" className="absolute left-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center border border-white/60 bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/60 md:flex"><ChevronLeft size={22} /></button>
          <button type="button" onClick={() => showSlide(activeIndex + 1)} aria-label="Siguiente diapositiva" className="absolute right-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center border border-white/60 bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/60 md:flex"><ChevronRight size={22} /></button>
        </>
      )}

      {/* ── Contenido — esquina inferior izquierda como Pandora ── */}
      <div className="absolute inset-0 z-10 flex flex-col justify-end pb-14 md:pb-16">
        <div className="container">
          {/* Botón CTA — estilo Pandora: fondo oscuro semitransparente, texto blanco, sin bordes redondeados */}
          <Link href="/catalogo"
            className="inline-flex items-center bg-black/80 text-white px-7 py-3.5 font-semibold text-sm tracking-widest uppercase hover:bg-black transition-colors shadow-lg active:scale-95"
            style={{ letterSpacing: "0.12em" }}>
            COMPRAR AHORA
          </Link>
        </div>
      </div>

      {/* ── Indicadores y controles — esquina inferior derecha ── */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 md:bottom-5 md:right-6">
          {slides.length > 1 && <div className="flex items-center gap-1" aria-label="Indicador de diapositivas">
            {slides.map((slide, index) => <button key={slide.id} type="button" onClick={() => showSlide(index)} aria-label={`Mostrar diapositiva ${index + 1}`} aria-current={index === activeIndex ? "true" : undefined} className={`h-1.5 w-1.5 rounded-full p-0 transition-all ${index === activeIndex ? "scale-110 bg-white shadow-[0_0_4px_rgba(255,255,255,0.9)]" : "bg-white/45 hover:bg-white/80"}`} style={{ minHeight: "auto", minWidth: "auto" }} />)}
          </div>}
          {showVideo && (
            <>
          <button onClick={togglePlay} aria-label={isPaused ? "Reproducir" : "Pausar"}
            className="w-9 h-9 bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
            style={{ minHeight: "auto" }}>
            {isPaused ? <Play size={14} fill="currentColor" aria-hidden="true" /> : <Pause size={14} fill="currentColor" aria-hidden="true" />}
          </button>
          <button onClick={toggleMute} aria-label={isMuted ? "Activar sonido" : "Silenciar"}
            className="w-9 h-9 bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
            style={{ minHeight: "auto" }}>
            {isMuted ? (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
            )}
          </button>
            </>
          )}
      </div>

    </section>
  );
}

function PromoCarousel() {
  const { data: config } = trpc.siteConfig.getPromoCarousel.useQuery();
  const slides = config?.slides ?? [];
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
    if (slides.length < 2) return;
    const timer = window.setInterval(() => setActiveIndex(current => getNextCarouselIndex(current, slides.length)), config?.intervalMs ?? 6000);
    return () => window.clearInterval(timer);
  }, [slides.length, config?.intervalMs]);

  if (slides.length === 0) return null;
  const activeSlide = slides[activeIndex % slides.length];

  return (
    <section id="promociones" className="relative isolate min-h-[430px] overflow-hidden bg-gray-100 md:min-h-[560px]" aria-label="Promociones destacadas">
      <div className="absolute inset-0">
        {activeSlide.mediaType === "video" ? (
          <video key={activeSlide.id} src={activeSlide.mediaUrl} autoPlay loop muted playsInline preload="metadata" className="h-full w-full object-cover" />
        ) : (
          <img key={activeSlide.id} src={activeSlide.mediaUrl} alt="Promoción Antonini" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="relative flex min-h-[430px] items-end md:min-h-[560px]">
        <div className="container flex items-end justify-between gap-5 py-10 md:py-14">
          <Link href={activeSlide.ctaHref} className="inline-flex items-center bg-black/85 px-7 py-3.5 text-sm font-semibold uppercase tracking-widest text-white shadow-lg transition-colors hover:bg-black active:scale-95">
            {activeSlide.ctaLabel}
          </Link>
          {slides.length > 1 && (
            <div className="flex items-center gap-2" aria-label="Indicador de diapositivas">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  aria-label={`Mostrar diapositiva ${index + 1}`}
                  aria-current={index === activeIndex ? "true" : undefined}
                  onClick={() => setActiveIndex(index)}
                  className={`h-2.5 w-2.5 shrink-0 rounded-full border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fff1b8] ${index === activeIndex ? "border-[#fff1b8] bg-[radial-gradient(circle_at_30%_25%,#fff6c8_0%,#e6c266_42%,#b88321_100%)] shadow-[0_0_10px_rgba(217,176,69,0.65)]" : "border-[#d8b861]/90 bg-[#f6e6b7]/35 hover:bg-[#e1c168]"}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function formatPrice(p: string | number) {
  return `$ ${Number(p).toLocaleString("es-CO")}`;
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ product, onAddSuccess }: { product: any; onAddSuccess?: (name: string, img: string) => void }) {
  const { addItem } = useCart();
  const { data: popupConfig } = trpc.siteConfig.getPopup.useQuery(undefined, { refetchOnWindowFocus: false });
  const [adding, setAdding] = useState(false);
  const imgs: string[] = Array.isArray(product.imageUrls) ? product.imageUrls : [];
  const regularPrice = Number(product.basePrice);
  const { price, discountPercent: popupDiscountPercent } = getPopupOfferForProduct(product.id, regularPrice, popupConfig);
  const configuredOriginalPrice = Number(product.originalPrice ?? product.original_price ?? 0);
  const compareAtPrice = popupDiscountPercent > 0 ? Math.max(configuredOriginalPrice, regularPrice) : configuredOriginalPrice;
  const { discountedPrice: displayedPrice, hasDiscount } = getDisplayProductPrice(price, compareAtPrice, 0);
  const displayedOriginalPrice = compareAtPrice > displayedPrice ? compareAtPrice : 0;
  const productGender = product.gender === "masculino" ? "Masculino" : product.gender === "femenino" ? "Femenino" : product.gender === "unisex" ? "Unisex" : product.gender === "ninos" ? "Niños" : "";

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAdding(true);
    await addItem(product.id, undefined, 1);
    onAddSuccess?.(product.name, imgs[0] ?? "");
    setTimeout(() => setAdding(false), 800);
  };

  return (
    <Link href={`/producto/${product.slug}`} className="group block bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5">
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {imgs[0] ? (
          <img src={imgs[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-200"><Gem size={40} /></div>
        )}
        {hasDiscount && (
          <div className="absolute top-2 left-2 bg-brand-green text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            {popupDiscountPercent > 0 ? `${popupDiscountPercent}% OFF` : "OFERTA"}
          </div>
        )}
        <button onClick={handleAdd}
          className="absolute bottom-3 right-3 bg-brand-green text-white p-2.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 hover:bg-brand-green-light active:scale-95"
          aria-label="Agregar al carrito">
          {adding
            ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin block" />
            : <ShoppingBag size={16} />}
        </button>
      </div>
      <div className="p-3.5">
        <p className="mb-1 text-[11px] font-bold tracking-[0.08em] uppercase text-brand-gold">{productGender || product.material || "ORO 18K"}{product.volumeMl ? ` · ${product.volumeMl} ml` : ""}</p>
        <p className="text-base font-semibold text-gray-900 leading-tight line-clamp-2 font-sans">{product.name}</p>
        <div className="mt-2">
          <p className="text-lg font-bold leading-none text-gray-950">{formatPrice(displayedPrice)}</p>
          {displayedOriginalPrice > displayedPrice && <p className="mt-1 text-sm font-medium text-gray-400 line-through decoration-gray-400">Antes: {formatPrice(displayedOriginalPrice)}</p>}
        </div>
      </div>
    </Link>
  );
}

// ─── Product Rails for Home ────────────────────────────────────────────────────
function HomeProductCarousel({ products, onAddSuccess }: { products: any[]; onAddSuccess?: (name: string, img: string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (direction: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: getHomeProductCarouselOffset(direction), behavior: "smooth" });
  };

  if (!products.length) return null;

  return (
    <div className="relative">
      <div className="mb-3 hidden items-center justify-end gap-2 md:flex">
        <button onClick={() => scroll("left")} className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-brand-green transition-colors hover:border-brand-green hover:bg-brand-green hover:text-white" aria-label="Ver productos anteriores">
          <ChevronLeft size={17} />
        </button>
        <button onClick={() => scroll("right")} className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-brand-green transition-colors hover:border-brand-green hover:bg-brand-green hover:text-white" aria-label="Ver más productos">
          <ChevronRight size={17} />
        </button>
      </div>
      <div ref={scrollRef} className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {products.map((product) => (
          <div key={product.id} className="w-[172px] shrink-0 snap-start sm:w-[205px] md:w-[232px]">
            <ProductCard product={product} onAddSuccess={onAddSuccess} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Category Carousel ────────────────────────────────────────────────────────
function CategorySection({ title, products, viewAllSlug, onAddSuccess }: { title: string; products: any[]; viewAllSlug: string; onAddSuccess?: (name: string, img: string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: "left" | "right") => scrollRef.current?.scrollBy({ left: dir === "left" ? -280 : 280, behavior: "smooth" });
  if (!products.length) return null;
  return (
    <section className="py-10 border-b border-gray-100 last:border-0">
      <div className="container">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl md:text-2xl font-sans font-bold text-gray-900">{title}</h2>
            <div className="h-0.5 w-12 bg-brand-gold mt-1 rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => scroll("left")} className="p-2 border border-gray-200 rounded-full hover:border-brand-green hover:text-brand-green transition-colors hidden md:flex"><ChevronLeft size={15} /></button>
            <button onClick={() => scroll("right")} className="p-2 border border-gray-200 rounded-full hover:border-brand-green hover:text-brand-green transition-colors hidden md:flex"><ChevronRight size={15} /></button>
            <Link href={`/catalogo/${viewAllSlug}`} className="text-xs font-bold text-brand-green hover:underline tracking-wide uppercase">Ver todos →</Link>
          </div>
        </div>
        <div ref={scrollRef} className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ msOverflowStyle: "none" }}>
          {products.map(p => (
            <div key={p.id} className="w-44 shrink-0 snap-start md:w-56">
              <ProductCard product={p} onAddSuccess={onAddSuccess} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
function TestimonialsSection({ testimonials }: { testimonials: any[] }) {
  const [idx, setIdx] = useState(0);
  const renderableTestimonials = getRenderableTestimonials(testimonials);
  const total = renderableTestimonials.length;
  const next = () => setIdx(i => total ? (i + 1) % total : 0);
  const prev = () => setIdx(i => total ? (i - 1 + total) % total : 0);
  useEffect(() => {
    if (!total) {
      setIdx(0);
      return;
    }
    setIdx(current => current >= total ? 0 : current);
    const timer = window.setInterval(() => setIdx(current => (current + 1) % total), 5000);
    return () => window.clearInterval(timer);
  }, [total]);
  if (!total) return null;
  const shown = getTestimonialWindow(renderableTestimonials, idx);
  return (
    <section className="py-16 bg-gray-50">
      <div className="container">
        <div className="text-center mb-10">
          <p className="text-xs font-bold tracking-widest uppercase text-brand-gold mb-2">Testimonios</p>
          <h2 className="text-3xl md:text-4xl font-sans font-bold text-gray-900">Lo que dicen nuestros clientes</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {shown.map((t, i) => (
            <div key={`${t.id}-${i}`} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex gap-0.5 mb-3">{[1,2,3,4,5].map(s => <Star key={s} size={14} className="fill-brand-gold text-brand-gold" />)}</div>
              <p className="text-gray-600 text-sm leading-relaxed italic mb-4">"{t.comment}"</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-green flex items-center justify-center text-white font-bold text-sm">{t.name.charAt(0)}</div>
                <span className="font-semibold text-gray-800 text-sm">{t.name}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-3 mt-8">
          <button onClick={prev} className="p-2 border border-gray-200 rounded-full hover:border-brand-green hover:text-brand-green transition-colors"><ChevronLeft size={18} /></button>
          <div className="flex gap-1.5 items-center">
            {renderableTestimonials.map((_, i) => <button key={i} onClick={() => setIdx(i)} className={`h-2 rounded-full transition-all ${i === idx ? "bg-brand-green w-5" : "bg-gray-300 w-2"}`} />)}
          </div>
          <button onClick={next} className="p-2 border border-gray-200 rounded-full hover:border-brand-green hover:text-brand-green transition-colors"><ChevronRight size={18} /></button>
        </div>
      </div>
    </section>
  );
}

// ─── Delivery Photos ──────────────────────────────────────────────────────────
const DEFAULT_DELIVERY_PHOTOS = [
  { id: "delivery-1", imageUrl: "/manus-storage/cliente-1_8037453c.jpg", alt: "Cliente feliz 1" },
  { id: "delivery-2", imageUrl: "/manus-storage/cliente-2_4156edc6.jpg", alt: "Cliente feliz 2" },
  { id: "delivery-3", imageUrl: "/manus-storage/cliente-3_68607b4d.jpg", alt: "Cliente feliz 3" },
  { id: "delivery-4", imageUrl: "/manus-storage/cliente-4_1752b95c.jpg", alt: "Cliente feliz 4" },
  { id: "delivery-5", imageUrl: "/manus-storage/cliente-5_554386b1.jpg", alt: "Cliente feliz 5" },
  { id: "delivery-6", imageUrl: "/manus-storage/cliente-6_63df3e68.jpg", alt: "Cliente feliz 6" },
];

// ─── Add to Cart Popup ────────────────────────────────────────────────────────
function AddToCartPopup({ visible, productName, productImg, onClose }: {
  visible: boolean; productName: string; productImg: string; onClose: () => void;
}) {
  return (
    <div className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-all duration-300 ${visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-sm transition-all duration-300 ${visible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"}`}>
        <div className="bg-brand-green text-white rounded-t-2xl px-5 py-4 flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <Check size={14} className="text-white" />
          </div>
          <p className="font-semibold text-sm flex-1">¡Producto agregado al carrito!</p>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors p-1"><X size={15} /></button>
        </div>
        <div className="flex items-center gap-4 px-5 py-4 border-b border-gray-100">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
            {productImg ? <img src={productImg} alt={productName} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Gem size={22} className="text-gray-300" /></div>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-brand-gold font-bold mb-0.5">ORO 18K</p>
            <p className="text-sm font-semibold text-gray-800 line-clamp-2 font-sans">{productName}</p>
          </div>
        </div>
        <div className="px-5 py-4 flex flex-col gap-2.5">
          <Link href="/checkout" onClick={onClose}
            className="flex items-center justify-center gap-2 w-full bg-brand-green text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-brand-green-light transition-colors shadow-sm active:scale-[0.98]">
            <ShoppingBag size={15} /> Ir a pagar
          </Link>
          <button onClick={onClose}
            className="w-full border border-gray-200 text-gray-600 py-3 rounded-xl font-medium text-sm hover:border-brand-green hover:text-brand-green transition-colors active:scale-[0.98]">
            Seguir comprando
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between py-4 text-left text-gray-800 font-semibold text-sm hover:text-brand-green transition-colors">
        {question}
        <ChevronRight size={16} className={`transition-transform duration-200 text-brand-gold flex-shrink-0 ${open ? "rotate-90" : ""}`} />
      </button>
      {open && <p className="pb-4 text-sm text-gray-600 leading-relaxed">{answer}</p>}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const { data: allProducts = [] } = trpc.products.list.useQuery({});
  const { data: testimonials = [] } = trpc.testimonials.list.useQuery();
  const { data: categories = [] } = trpc.categories.list.useQuery();
  const { data: perfumeriaProducts = [] } = trpc.products.byHomeSection.useQuery({ section: "perfumeria", limit: 8 });
  const { data: trendingProducts = [] } = trpc.products.byHomeSection.useQuery({ section: "trending", limit: 8 });
  const { data: under300kProducts = [] } = trpc.products.byHomeSection.useQuery({ section: "under300k", limit: 8 });
  const { data: under800kProducts = [] } = trpc.products.byHomeSection.useQuery({ section: "under800k", limit: 8 });
  const { data: deliveryConfig } = trpc.siteConfig.getDeliveryPhotos.useQuery();
  const [popup, setPopup] = useState({ visible: false, name: "", img: "" });
  const deliveryPhotos = deliveryConfig?.photos ?? DEFAULT_DELIVERY_PHOTOS;

  const byCategory = (slug: string) => {
    const cat = categories.find((c: any) => c.slug === slug);
    if (!cat) return [];
    return allProducts.filter((p: any) => p.categoryId === cat.id).slice(0, 8);
  };
  const under300k = getAssignedJewelryProducts(under300kProducts, "under300k").slice(0, 8);
  const under800k = getAssignedJewelryProducts(under800kProducts, "under800k").slice(0, 8);
  const trending = getAssignedTrendingProducts(trendingProducts).slice(0, 8);

  const handleAddSuccess = (name: string, img: string) => {
    setPopup({ visible: true, name, img });
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* ── HERO: Video full-screen tipo Pandora ── */}
      <HeroSection />

      {/* ── TRUST BADGES ── */}
      <section className="bg-brand-green">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 md:divide-x md:divide-white/10">
            {[
              { icon: null, label: "Perfumería Original", sub: "Somos Importadores" },
              { icon: Award, label: "Oro 18K certificado", sub: "Autenticidad garantizada" },
              { icon: Truck, label: "Paga al recibir", sub: "Contra entrega segura" },
              { icon: Gem, label: "Fabricantes directos", sub: "Sin intermediarios" },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex flex-col items-center text-center py-5 px-4 gap-1.5">
                {Icon ? (
                  <Icon size={20} className="text-brand-gold" />
                ) : (
                  /* Perfume bottle SVG icon */
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-brand-gold">
                    <path d="M9 3h6v2H9z"/>
                    <path d="M8 5h8a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/>
                    <path d="M12 10v4M10 12h4"/>
                    <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none"/>
                  </svg>
                )}
                <p className="text-sm font-bold uppercase tracking-wide text-white">{label}</p>
                <p className="text-[11px] text-white/60">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OFFER BANNER ── */}
      <section className="py-12 bg-gray-50">
        <div className="container">
          <div className="bg-brand-green rounded-3xl px-6 md:px-12 py-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
            <p className="text-brand-gold text-xs font-bold tracking-widest uppercase mb-2 relative">Oferta Especial</p>
            <h2 className="text-3xl md:text-5xl font-sans font-bold text-white mb-6 relative">
              Entre más lleves, <span className="text-brand-gold">más ahorras</span>
            </h2>
            <div className="flex flex-wrap justify-center gap-4 mb-8 relative">
              {[
                { label: "5% OFF", sub: "Llevando 2 piezas", color: "bg-white/10" },
                { label: "10% OFF", sub: "Llevando 3 piezas", color: "bg-white/15" },
                { label: "15% OFF", sub: "Llevando 4+ piezas", color: "bg-brand-gold/20 border-brand-gold/40" },
              ].map(({ label, sub, color }) => (
                <div key={label} className={`${color} border border-white/20 rounded-2xl px-8 py-4 text-center backdrop-blur-sm`}>
                  <p className="text-brand-gold text-2xl font-bold font-sans">{label}</p>
                  <p className="text-white/70 text-xs mt-1">{sub}</p>
                </div>
              ))}
            </div>
            <Link href="/catalogo" className="inline-flex items-center gap-2 bg-brand-gold text-white px-8 py-3 rounded-full font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg relative active:scale-95">
              Armar mi combo →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 1. POR MENOS DE $300.000 ── */}
      {under300k.length > 0 && (
        <section className="py-12 bg-gray-50">
          <div className="container">
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-xs font-bold tracking-widest uppercase text-brand-gold mb-1">Oro Laminado Americano</p>
                <h2 className="text-2xl md:text-3xl font-sans font-bold text-gray-900">Por menos de $300.000</h2>
                <div className="h-0.5 w-12 bg-brand-gold mt-2 rounded-full" />
              </div>
              <Link href="/catalogo" className="text-xs font-bold text-brand-green hover:underline tracking-wide uppercase">Ver todos →</Link>
            </div>
            <HomeProductCarousel products={under300k} onAddSuccess={handleAddSuccess} />
          </div>
        </section>
      )}

      {/* ── 2. POR MENOS DE $800.000 ── */}
      {under800k.length > 0 && (
        <section className="py-12 bg-gray-50">
          <div className="container">
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-xs font-bold tracking-widest uppercase text-brand-gold mb-1">Oro 18K Nacional Macizo</p>
                <h2 className="text-2xl md:text-3xl font-sans font-bold text-gray-900">Por menos de $800.000</h2>
                <div className="h-0.5 w-12 bg-brand-gold mt-2 rounded-full" />
              </div>
              <Link href="/catalogo" className="text-xs font-bold text-brand-green hover:underline tracking-wide uppercase">Ver todos →</Link>
            </div>
            <HomeProductCarousel products={under800k} onAddSuccess={handleAddSuccess} />
          </div>
        </section>
      )}

      {/* ── 3. CATEGORÍAS DE PRODUCTOS ── */}
      <section className="bg-white">
        {[
          { title: "Cadenas", slug: "cadenas" },
          { title: "Pulsos", slug: "pulsos" },
          { title: "Dijes", slug: "dijes" },
          { title: "Pulseras", slug: "pulseras" },
          { title: "Brazaletes", slug: "brazaletes" },
          { title: "Anillos", slug: "anillos" },
          { title: "Argollas", slug: "argollas" },
        ].map(({ title, slug }) => (
          <CategorySection key={slug} title={title} products={byCategory(slug)} viewAllSlug={slug} onAddSuccess={handleAddSuccess} />
        ))}
      </section>

      <PromoCarousel />

      {/* ── 4. EN TENDENCIA AHORA ── */}
      {trending.length > 0 && (
        <section className="py-12 bg-white">
          <div className="container">
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-xs font-bold tracking-widest uppercase text-brand-gold mb-1">Lo más buscado</p>
                <h2 className="text-2xl md:text-3xl font-sans font-bold text-gray-900">En tendencia ahora 🔥</h2>
                <div className="h-0.5 w-12 bg-brand-gold mt-2 rounded-full" />
              </div>
              <Link href="/catalogo" className="text-xs font-bold text-brand-green hover:underline tracking-wide uppercase">Ver todos →</Link>
            </div>
            <HomeProductCarousel products={trending} onAddSuccess={handleAddSuccess} />
          </div>
        </section>
      )}

      {/* ── 5. PERFUMERÍA ── */}
      {perfumeriaProducts.length > 0 && (
        <section className="py-14 bg-white">
          <div className="container">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-xs font-bold tracking-widest uppercase text-brand-gold mb-1">Importados originales</p>
                <h2 className="text-2xl md:text-3xl font-sans font-bold text-gray-900">Perfumería Original</h2>
                <div className="h-0.5 w-12 bg-brand-gold mt-2 rounded-full" />
              </div>
              <Link href="/catalogo/perfumeria" className="text-xs font-bold text-brand-green hover:underline tracking-wide uppercase">Ver todos →</Link>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="relative rounded-2xl overflow-hidden bg-gray-900 min-h-[280px] flex items-end">
                <img src="/manus-storage/Capturadepantalla2026-08-04002934_c5420884.png" alt="Perfumería Antonini" className="absolute inset-0 w-full h-full object-cover opacity-100" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                <div className="relative p-6 text-white">
                  <p className="text-brand-gold text-xs font-bold uppercase tracking-widest mb-2 drop-shadow-lg">100% Originales</p>
                  <h3 className="text-3xl font-bold leading-tight mb-2 drop-shadow-lg">Fragancias<br />Importadas</h3>
                  <p className="text-white text-sm mb-4 drop-shadow-lg">Masculino · Femenino · Unisex</p>
                  <Link href="/catalogo/perfumeria" className="inline-flex items-center gap-1.5 bg-white text-gray-900 px-4 py-2 rounded-full text-xs font-bold hover:bg-brand-gold hover:text-white transition-colors">
                    Ver colección →
                  </Link>
                </div>
              </div>
              <div className="lg:col-span-2">
                <HomeProductCarousel products={perfumeriaProducts.slice(0, 6)} onAddSuccess={handleAddSuccess} />
              </div>
            </div>
          </div>
        </section>
      )}

          {/* ── DELIVERY SECTION ── */}
      <section className="py-14 bg-white">
        <div className="container">
          <div className="text-center mb-8">
            <p className="text-xs font-bold tracking-widest uppercase text-brand-gold mb-2">Entregas Seguras</p>
            <h2 className="text-3xl md:text-4xl font-sans font-bold text-gray-900">Nuestros clientes nos recomiendan</h2>
            <p className="mt-2 text-gray-500 text-sm max-w-lg mx-auto">Cada entrega es un momento especial. Garantía de autenticidad en cada joya.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {deliveryPhotos.map((photo, i) => (
              <div key={photo.id} className="relative aspect-square rounded-2xl overflow-hidden group">
                <img src={photo.imageUrl} alt={photo.alt || `Cliente feliz ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="bg-brand-gold text-white text-xs font-semibold px-2 py-1 rounded-full">✓ Entregado</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <TestimonialsSection testimonials={testimonials} />

      {/* ── FAQ ── */}
      <section className="py-14 bg-white">
        <div className="container max-w-2xl">
          <div className="text-center mb-8">
            <p className="text-xs font-bold tracking-widest uppercase text-brand-gold mb-2">Resolvemos tus dudas</p>
            <h2 className="text-3xl font-sans font-bold text-gray-900">Preguntas Frecuentes</h2>
          </div>
          {[
            { q: "¿Tienen punto físico?", a: "Sí, contamos con punto de venta en Bogotá. También realizamos envíos a todo Colombia con pago contra entrega." },
            { q: "¿El oro es auténtico?", a: "Todos nuestros productos son fabricados en oro 18k certificado. Cada pieza incluye certificado de autenticidad." },
            { q: "¿Qué medios de pago manejan?", a: "Aceptamos pago contra entrega, transferencia bancaria y tarjeta de crédito/débito en línea." },
            { q: "¿Cuánto tarda el envío?", a: "Los envíos tardan entre 2 y 5 días hábiles. Ciudades principales en 2-3 días." },
            { q: "¿Puedo personalizar una joya?", a: "¡Sí! Contáctanos por WhatsApp para diseños personalizados con grabados, iniciales o formas especiales." },
          ].map(({ q, a }) => <FaqItem key={q} question={q} answer={a} />)}
        </div>
      </section>

      <Footer />

      {/* ── WHATSAPP FLOATING BUTTON ── */}
      <a
        href="https://wa.me/573169308533?text=Hola%20Antonini%20Joyer%C3%ADa%2C%20me%20interesa%20conocer%20sus%20productos%20de%20oro%2018k%20%F0%9F%92%8E"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contactar por WhatsApp"
        className="fixed bottom-6 right-6 z-50 group"
        style={{ minHeight: "auto" }}
      >
        <div className="relative w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-transform duration-200 hover:scale-110 active:scale-95"
          style={{ background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)" }}>
          <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          {/* Gold 24K badge */}
          <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black shadow-lg"
            style={{ background: "linear-gradient(135deg, #FFD700 0%, #C9A84C 60%, #FFD700 100%)", color: "#5a3e00" }}>
            24K
          </div>
        </div>
        {/* Tooltip */}
        <div className="absolute right-16 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          ¡Escríbenos ahora!
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[7px] border-4 border-transparent border-l-gray-900" />
        </div>
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ backgroundColor: "#25D366" }} />
      </a>

      {/* ── ADD TO CART POPUP ── */}
      <AddToCartPopup
        visible={popup.visible}
        productName={popup.name}
        productImg={popup.img}
        onClose={() => setPopup(p => ({ ...p, visible: false }))}
        />
    </div>
  );
}
