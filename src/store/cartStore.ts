import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/types';

export interface CartProduct {
  id: string;
  name: string;
  name_en: string;
  price: number;
  compare_at_price?: number;
  image?: string;
  slug: string;
}

export interface CartItemState {
  product: CartProduct;
  quantity: number;
}

interface CartState {
  items: CartItemState[];
  isOpen: boolean;

  // Actions
  addItem: (product: Product | CartProduct, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  setCartOpen: (open: boolean) => void;

  // Computed
  getItemCount: () => number;
  getSubtotal: () => number;
  getItem: (productId: string) => CartItemState | undefined;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, quantity = 1) => {
        console.log('🛒 [CartStore] addItem called with product:', product);
        console.log('🛒 [CartStore] Product price:', product.price);
        console.log('🛒 [CartStore] Quantity:', quantity);
        
        const items = get().items;
        const existingIndex = items.findIndex(item => item.product.id === product.id);

        const cartProduct: CartProduct = {
          id: product.id,
          name: product.name,
          name_en: product.name_en,
          price: product.price || 0,
          compare_at_price: product.compare_at_price,
          image: 'images' in product && product.images?.[0]?.url
            ? product.images[0].url
            : undefined,
          slug: product.slug,
        };
        
        console.log('🛒 [CartStore] CartProduct created:', cartProduct);

        if (existingIndex > -1) {
          const newItems = [...items];
          newItems[existingIndex].quantity += quantity;
          set({ items: newItems });
          console.log('🛒 [CartStore] Item quantity updated');
        } else {
          set({ items: [...items, { product: cartProduct, quantity }] });
          console.log('🛒 [CartStore] New item added to cart');
        }
      },

      removeItem: (productId) => {
        set({ items: get().items.filter(item => item.product.id !== productId) });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        set({
          items: get().items.map(item =>
            item.product.id === productId
              ? { ...item, quantity }
              : item
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      toggleCart: () => set({ isOpen: !get().isOpen }),

      setCartOpen: (open) => set({ isOpen: open }),

      getItemCount: () => get().items.reduce((acc, item) => acc + item.quantity, 0),

      getSubtotal: () => {
        const subtotal = get().items.reduce((acc, item) => {
          const itemTotal = (item.product.price || 0) * (item.quantity || 0);
          console.log('💰 [CartStore] Item subtotal:', item.product.name, 'price:', item.product.price, 'qty:', item.quantity, 'total:', itemTotal);
          return acc + itemTotal;
        }, 0);
        console.log('💰 [CartStore] Total subtotal:', subtotal);
        return subtotal;
      },

      getItem: (productId) =>
        get().items.find(item => item.product.id === productId),
    }),
    {
      name: 'gaby-cart-storage',
    }
  )
);
