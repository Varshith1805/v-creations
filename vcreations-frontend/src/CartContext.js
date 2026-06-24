import React, { createContext, useContext, useState } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [appliedOffers, setAppliedOffers] = useState({});
  const [userEmail, setUserEmail] = useState(localStorage.getItem("vc_user_email") || "");

  const login = (email) => {
    setUserEmail(email);
    localStorage.setItem("vc_user_email", email);
  };

  const logout = () => {
    setUserEmail("");
    localStorage.removeItem("vc_user_email");
  };

  const addToCart = (product, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(item => item.product._id === product._id);
      if (existing) {
        return prev.map(item =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (productId) => {
    setItems(prev => prev.filter(item => item.product._id !== productId));
    setAppliedOffers(prev => { const n = {...prev}; delete n[productId]; return n; });
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems(prev =>
      prev.map(item =>
        item.product._id === productId ? { ...item, quantity } : item
      )
    );
    setAppliedOffers(prev => { const n = {...prev}; delete n[productId]; return n; });
  };

  const clearCart = () => { setItems([]); setAppliedOffers({}); };

  const applyOffer = (productId, offerData) => {
    setAppliedOffers(prev => ({ ...prev, [productId]: offerData }));
  };

  return (
    <CartContext.Provider value={{ items, appliedOffers, userEmail, addToCart, removeFromCart, updateQuantity, clearCart, applyOffer, login, logout }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
