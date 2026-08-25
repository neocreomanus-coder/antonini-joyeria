import { useState, useEffect } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal } from "lucide-react";
import { getProductSubcategories, getSubcategoryTitle } from "@/lib/productSubcategories";
import { getPublicCategory, isPerfumeryCategory, JEWELRY_CATEGORIES, PERFUMERY_CATEGORY } from "@/lib/productTaxonomy";
import { isJewelryProduct } from "@/lib/homeSectionFilters";

export default function Catalogo() {
  const [, params] = useRoute("/catalogo/:categoria");
  const [location] = useLocation();
  const urlParams = new URLSearchParams(location.split("?")[1] ?? "");
  const initialSearch = urlParams.get("buscar") ?? "";

  const activeSlug = params?.categoria ?? "";
  const [search, setSearch] = useState(initialSearch);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [selectedGender, setSelectedGender] = useState<"" | "masculino" | "femenino" | "unisex" | "ninos">("");
  const PAGE_SIZE = 60;
  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE);

  const { data: allCategories = [] } = trpc.categories.list.useQuery();
  const activeCategory = allCategories.find(c => c.slug === activeSlug);

  const { data: queriedProducts = [], isLoading } = trpc.products.list.useQuery({
    categoryId: activeCategory?.id ? Number(activeCategory.id) : undefined,
    search: search || undefined,
    gender: selectedGender || undefined,
    limit: visibleLimit + 1,
  });

  useEffect(() => {
    setVisibleLimit(PAGE_SIZE);
  }, [activeSlug, search, selectedGender]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const activeName = getPublicCategory(activeSlug)?.name ?? "Todos";
  const isPerfumeria = isPerfumeryCategory(activeSlug);
  const subcategoryOptions = getProductSubcategories(activeSlug);
  const hasMore = queriedProducts.length > visibleLimit;
  const loadedProducts = queriedProducts.slice(0, visibleLimit);
  const products = activeSlug ? loadedProducts : loadedProducts.filter(isJewelryProduct);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50 pt-20 md:pt-24">
        {/* Page header */}
        <div className="bg-brand-green py-12">
        <div className="container text-center">
          <p className="text-brand-gold text-xs uppercase tracking-widest mb-2">{isPerfumeria ? "Perfumería Original" : "Joyería de Oro 18K"}</p>
          <h1 className="font-sans text-4xl font-bold text-white">{activeName}</h1>
          <p className="text-white/60 mt-2 text-sm">{products.length} productos encontrados</p>
        </div>
        </div>

        <div className="container py-8">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            {/* Category tabs are deliberately grouped to keep jewelry and perfumery independent. */}
            <div className="space-y-3">
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">Joyería</p>
                <div className="flex flex-wrap gap-2">
                  <Link href="/catalogo">
                    <button className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                      !activeSlug ? "bg-brand-green text-white border-brand-green" : "bg-white text-gray-700 border-gray-200 hover:border-brand-green hover:text-brand-green"
                    }`}>Todas las joyas</button>
                  </Link>
                  {JEWELRY_CATEGORIES.map((category) => (
                    <Link key={category.slug} href={`/catalogo/${category.slug}`}>
                      <button className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                        activeSlug === category.slug ? "bg-brand-green text-white border-brand-green" : "bg-white text-gray-700 border-gray-200 hover:border-brand-green hover:text-brand-green"
                      }`}>{category.name}</button>
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">Perfumería</p>
                <Link href={`/catalogo/${PERFUMERY_CATEGORY.slug}`}>
                  <button className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                    isPerfumeria ? "bg-brand-green text-white border-brand-green" : "bg-white text-gray-700 border-gray-200 hover:border-brand-green hover:text-brand-green"
                  }`}>{PERFUMERY_CATEGORY.name}</button>
                </Link>
              </div>
            </div>
            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2 md:ml-auto">
              <Input value={searchInput} onChange={e => setSearchInput(e.target.value)}
                placeholder="Buscar productos..." className="w-52 h-9 text-sm" />
              <Button type="submit" size="sm" variant="outline" className="border-gold-300 h-9">
                <Search className="w-4 h-4" />
              </Button>
            </form>
          </div>

          {activeSlug && (
            <div className="mb-8 rounded-2xl border border-[#CDAA4E]/30 bg-white p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-brand-green">{getSubcategoryTitle(activeSlug)}</p>
              <div className="flex flex-wrap gap-2">
                {subcategoryOptions.map(({ value, label }) => (
                  <button
                    key={value || "todos"}
                    type="button"
                    onClick={() => setSelectedGender(value)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                      selectedGender === value
                        ? "border-brand-green bg-brand-green text-white"
                        : "border-[#CDAA4E]/40 bg-white text-gray-700 hover:border-brand-green hover:text-brand-green"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Products grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden border border-gold-100 animate-pulse">
                  <div className="aspect-square bg-gold-100" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-gold-100 rounded w-1/2" />
                    <div className="h-4 bg-gold-100 rounded w-3/4" />
                    <div className="h-4 bg-gold-100 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-sans text-2xl text-[oklch(0.35_0.02_60)] mb-2">No se encontraron productos</p>
              <p className="text-[oklch(0.52_0.02_60)] text-sm">Intenta con otra categoría o término de búsqueda</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {products.map(p => <ProductCard key={p.id} {...p} />)}
              </div>

              {hasMore && (
                <div className="mt-10 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisibleLimit(current => current + PAGE_SIZE)}
                    className="rounded-xl border border-brand-green px-6 py-3 text-sm font-semibold text-brand-green transition-colors hover:bg-brand-green hover:text-white"
                  >
                    Cargar más productos
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
