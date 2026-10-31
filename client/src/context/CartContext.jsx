import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("alpha_cart");
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Sync with LocalStorage on every cart update
  useEffect(() => {
    localStorage.setItem("alpha_cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product === product._id);
      if (existing) {
        return prev.map((item) =>
          item.product === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }
      return [
        ...prev,
        {
          product: product._id,
          productId: product._id,
          title: product.title,
          slug: product.slug,
          price: product.price,
          mrp: product.mrp,
          image: product.images?.[0] || "",
          quantity,
        },
      ];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (productId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product === productId ? { ...item, quantity: newQty } : item,
      ),
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.product !== productId));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("alpha_cart");
  };

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const cartMrpTotal = cart.reduce(
    (sum, item) => sum + (item.mrp || item.price) * item.quantity,
    0,
  );
  const totalSavings = Math.max(0, cartMrpTotal - cartSubtotal);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItemsCount,
        cartSubtotal,
        cartMrpTotal,
        totalSavings,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
