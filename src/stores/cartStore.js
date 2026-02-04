/**
 * MYSTATION - Cart Store
 * Shopping cart state management with Zustand
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      // Add item to cart
      addItem: (product, variant) => {
        const items = get().items;
        const existingIndex = items.findIndex(
          (item) => item.variantId === variant.id
        );

        if (existingIndex > -1) {
          // Increase quantity if already in cart
          const newItems = [...items];
          newItems[existingIndex].quantity += 1;
          set({ items: newItems, isOpen: true });
        } else {
          // Add new item
          set({
            items: [
              ...items,
              {
                id: product.id,
                variantId: variant.id,
                name: product.name,
                variantName: variant.name,
                price: parseFloat(variant.retail_price) || 0,
                image: variant.files?.[0]?.preview_url || product.image,
                quantity: 1,
                printfulVariantId: variant.variant_id,
                printfulSyncVariantId: variant.id,
              },
            ],
            isOpen: true,
          });
        }
      },

      // Remove item from cart
      removeItem: (variantId) => {
        set({
          items: get().items.filter((item) => item.variantId !== variantId),
        });
      },

      // Update quantity
      updateQuantity: (variantId, quantity) => {
        if (quantity < 1) {
          get().removeItem(variantId);
          return;
        }

        set({
          items: get().items.map((item) =>
            item.variantId === variantId ? { ...item, quantity } : item
          ),
        });
      },

      // Clear cart
      clearCart: () => set({ items: [] }),

      // Toggle cart drawer
      toggleCart: () => set({ isOpen: !get().isOpen }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      // Get cart totals
      getSubtotal: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'mystation-cart',
    }
  )
);
