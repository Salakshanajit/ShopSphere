import { useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

// Shared "Add to cart" behaviour for product cards and the product details page.
export default function useAddToCart() {
  const { user } = useAuth();
  const { addItem } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [busyId, setBusyId] = useState(null);

  const addToCart = useCallback(
    async (product, quantity = 1) => {
      if (!user) {
        navigate('/login', {
          state: { from: location, message: 'Please log in to add items to your cart.' },
        });
        return false;
      }
      setBusyId(product.id);
      try {
        await addItem(product.id, quantity);
        toast.success(`${product.name} was added to your cart.`);
        return true;
      } catch (error) {
        toast.error(error.message);
        return false;
      } finally {
        setBusyId(null);
      }
    },
    [user, addItem, toast, navigate, location]
  );

  return { addToCart, busyId };
}
