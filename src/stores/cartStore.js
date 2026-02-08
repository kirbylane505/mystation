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

      // Add item to cart (supports 'printful' and 'printify' providers)
      addItem: (product, variant, provider = 'printful') => {
        const items = get().items;
        const cartKey = `${provider}_${variant.id}`;
        const existingIndex = items.findIndex(
          (item) => item.variantId === cartKey
        );

        if (existingIndex > -1) {
          // Increase quantity if already in cart
          const newItems = [...items];
          newItems[existingIndex].quantity += 1;
          set({ items: newItems, isOpen: true });
        } else {
          // Build provider-specific fields
          const providerFields =
            provider === 'printify'
              ? {
                  printifyProductId: product.id,
                  printifyVariantId: variant.id,
                }
              : {
                  printfulVariantId: variant.variant_id,
                  printfulSyncVariantId: variant.id,
                };

          // Resolve price & image per provider
          const price =
            provider === 'printify'
              ? parseFloat(variant.price) / 100 || 0
              : parseFloat(variant.retail_price) || 0;

          const image =
            provider === 'printify'
              ? variant.image || product.image
              : variant.files?.[0]?.preview_url || product.image;

          set({
            items: [
              ...items,
              {
                id: product.id,
                variantId: cartKey,
                name: product.name,
                variantName: variant.title || variant.name,
                price,
                image,
                quantity: 1,
                provider,
                ...providerFields,
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

      // Bundle discount tiers
      getDiscount: () => {
        const itemCount = get().getItemCount();
        if (itemCount >= 5) return { percent: 15, label: '15% OFF — 5+ items' };
        if (itemCount >= 2) return { percent: 10, label: '10% OFF — 2+ items' };
        return { percent: 0, label: null };
      },

      getDiscountedTotal: () => {
        const subtotal = get().getSubtotal();
        const { percent } = get().getDiscount();
        return subtotal * (1 - percent / 100);
      },

      // Filter helpers by provider
      getPrintfulItems: () => {
        return get().items.filter((item) => item.provider === 'printful' || !item.provider);
      },

      getPrintifyItems: () => {
        return get().items.filter((item) => item.provider === 'printify');
      },
    }),
    {
      name: 'mystation-cart',
    }
  )
);
