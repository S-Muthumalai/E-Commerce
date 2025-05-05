// context/CartContext.tsx
import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext({
  cartCount: 0,
  refreshCart: () => {},
});

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cartCount, setCartCount] = useState(0);

  const refreshCart = async () => {
    try {
      const res = await fetch("/api/cart");
      const data = await res.json();
      setCartCount(data.length);
    } catch {
      setCartCount(0);
    }
  };

  useEffect(() => {
    refreshCart();
  }, []);

  return (
    <CartContext.Provider value={{ cartCount, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
