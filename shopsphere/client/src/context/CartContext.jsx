import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { cartApi } from '../services/shop';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

const EMPTY_CART = { items: [], itemCount: 0, subtotal: 0, total: 0 };

// The cart lives in the database. This context keeps a copy for the page to display.
export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(EMPTY_CART);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setCart(await cartApi.get());
    } catch {
      /* the page that needs the cart shows its own error */
    } finally {
      setLoading(false);
    }
  }, []);

  // Load the saved cart when someone logs in; empty it when they log out.
  useEffect(() => {
    if (user) refresh();
    else setCart(EMPTY_CART);
  }, [user, refresh]);

  // Each action returns the new cart from the server. Errors are thrown to the caller.
  const addItem = useCallback(async (productId, quantity = 1) => {
    setCart(await cartApi.add(productId, quantity));
  }, []);

  const setQuantity = useCallback(async (productId, quantity) => {
    setCart(await cartApi.setQuantity(productId, quantity));
  }, []);

  const removeItem = useCallback(async (productId) => {
    setCart(await cartApi.remove(productId));
  }, []);

  const clearCart = useCallback(async () => {
    setCart(await cartApi.clear());
  }, []);

  const getQuantity = useCallback(
    (productId) => cart.items.find((item) => item.productId === productId)?.quantity || 0,
    [cart]
  );

  const value = useMemo(
    () => ({ ...cart, loading, refresh, addItem, setQuantity, removeItem, clearCart, getQuantity }),
    [cart, loading, refresh, addItem, setQuantity, removeItem, clearCart, getQuantity]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside <CartProvider>');
  return context;
}
