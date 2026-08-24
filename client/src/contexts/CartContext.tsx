import React, { createContext, useContext, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { nanoid } from "nanoid";

export type CartItemFull = {
  id: number;
  quantity: number;
  productId: number;
  variantId: number | null;
  productName: string | null;
  productSlug: string | null;
  productMaterial: string | null;
  productReference: string | null;
  productBasePrice: string | null;
  productImageUrls: string[] | null;
  variantType: string | null;
  variantValue: string | null;
  variantPriceModifier: string | null;
};

type CartContextType = {
  items: CartItemFull[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (productId: number, variantId?: number, quantity?: number) => Promise<void>;
  updateQuantity: (id: number, quantity: number) => Promise<void>;
  removeItem: (id: number) => Promise<void>;
  clearCart: () => Promise<void>;
  itemCount: number;
  subtotal: number;
  subtotalBeforePopupDiscount: number;
  popupDiscountAmount: number;
  popupDiscountPercent: number | null;
  getItemUnitPrice: (item: CartItemFull) => number;
  sessionId: string;
  refetch: () => void;
};

const CartContext = createContext<CartContextType | null>(null);

function getOrCreateSessionId() {
  let id = localStorage.getItem("cart_session_id");
  if (!id) { id = nanoid(); localStorage.setItem("cart_session_id", id); }
  return id;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId] = useState(() => getOrCreateSessionId());

  const { data: items = [], refetch } = trpc.cart.get.useQuery(
    { sessionId: user ? undefined : sessionId },
    { refetchOnWindowFocus: false }
  );
  const { data: popupConfig } = trpc.siteConfig.getPopup.useQuery(undefined, { refetchOnWindowFocus: false });

  const addMutation = trpc.cart.add.useMutation({ onSuccess: () => refetch() });
  const updateMutation = trpc.cart.updateQuantity.useMutation({ onSuccess: () => refetch() });
  const removeMutation = trpc.cart.remove.useMutation({ onSuccess: () => refetch() });
  const clearMutation = trpc.cart.clear.useMutation({ onSuccess: () => refetch() });

  const addItem = async (productId: number, variantId?: number, quantity = 1) => {
    await addMutation.mutateAsync({ productId, variantId, quantity, sessionId: user ? undefined : sessionId });
    setIsOpen(true);
  };

  const updateQuantity = async (id: number, quantity: number) => {
    await updateMutation.mutateAsync({ id, quantity });
  };

  const removeItem = async (id: number) => {
    await removeMutation.mutateAsync({ id });
  };

  const clearCart = async () => {
    await clearMutation.mutateAsync({ sessionId: user ? undefined : sessionId });
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const getUndiscountedUnitPrice = (item: CartItemFull) => {
    const base = parseFloat(item.productBasePrice ?? "0");
    const mod = parseFloat(item.variantPriceModifier ?? "0");
    return base + mod;
  };
  const hasPopupOfferForItem = (item: CartItemFull) => Boolean(
    popupConfig?.enabled && popupConfig.productId === item.productId && (popupConfig.discount ?? 0) > 0,
  );
  const getItemUnitPrice = (item: CartItemFull) => {
    const price = getUndiscountedUnitPrice(item);
    return hasPopupOfferForItem(item) ? Math.round(price * (1 - (popupConfig?.discount ?? 0) / 100) * 100) / 100 : price;
  };
  const subtotalBeforePopupDiscount = items.reduce((sum, item) => {
    return sum + getUndiscountedUnitPrice(item) * item.quantity;
  }, 0);
  const subtotal = items.reduce((sum, item) => {
    return sum + getItemUnitPrice(item) * item.quantity;
  }, 0);
  const popupDiscountAmount = Math.max(0, Math.round((subtotalBeforePopupDiscount - subtotal) * 100) / 100);
  const popupDiscountPercent = popupDiscountAmount > 0 ? popupConfig?.discount ?? null : null;

  return (
    <CartContext.Provider value={{
      items: items as CartItemFull[],
      isOpen, openCart: () => setIsOpen(true), closeCart: () => setIsOpen(false),
      toggleCart: () => setIsOpen(p => !p),
      addItem, updateQuantity, removeItem, clearCart,
      itemCount, subtotal, subtotalBeforePopupDiscount, popupDiscountAmount, popupDiscountPercent, getItemUnitPrice, sessionId, refetch,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
