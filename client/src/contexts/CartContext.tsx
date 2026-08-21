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

  const subtotal = items.reduce((sum, item) => {
    const base = parseFloat(item.productBasePrice ?? "0");
    const mod = parseFloat(item.variantPriceModifier ?? "0");
    return sum + (base + mod) * item.quantity;
  }, 0);

  return (
    <CartContext.Provider value={{
      items: items as CartItemFull[],
      isOpen, openCart: () => setIsOpen(true), closeCart: () => setIsOpen(false),
      toggleCart: () => setIsOpen(p => !p),
      addItem, updateQuantity, removeItem, clearCart,
      itemCount, subtotal, sessionId, refetch,
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

