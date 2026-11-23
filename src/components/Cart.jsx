/**
 * MYSTATION - Cart (lightweight shell)
 *
 * Only exports a lightweight CartButton for Navbar + a dynamic-loaded
 * CartDrawer that pulls in framer-motion ONLY after the user opens the cart.
 * Prior to this split, every page bundled framer-motion via Cart in the root
 * layout. The drawer code now lives in CartDrawer.jsx and is loaded on demand.
 */

"use client";

import dynamic from "next/dynamic";
import { useCartStore } from "@/store/cartStore";
import { ShoppingBag } from "lucide-react";

// framer-motion-heavy drawer, lazy-loaded the first time isOpen flips true
const CartDrawer = dynamic(() => import("./CartDrawer"), {
  ssr: false,
  loading: () => null,
});

export default function Cart() {
  const isOpen = useCartStore((s) => s.isOpen);
  // Nothing to render (and nothing to download) until the drawer is opened.
  if (!isOpen) return null;
  return <CartDrawer />;
}

// Lightweight cart button for Navbar — CSS-only badge animation, no framer-motion.
export function CartButton() {
  const toggleCart = useCartStore((s) => s.toggleCart);
  const itemCount = useCartStore((s) => s.getItemCount());

  return (
    <button
      onClick={toggleCart}
      className="relative p-2 rounded-full hover:bg-white/10 transition"
      aria-label="Open cart"
    >
      <ShoppingBag size={24} className="text-white" />
      {itemCount > 0 && (
        <span
          key={itemCount}
          className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center cart-badge-pulse"
        >
          {itemCount > 9 ? "9+" : itemCount}
        </span>
      )}
    </button>
  );
}
