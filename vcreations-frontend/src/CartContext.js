import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [appliedOffers, setAppliedOffers] = useState({});
  const [userEmail, setUserEmail] = useState(localStorage.getItem("vc_user_email") || "");
  const [userName, setUserName] = useState(localStorage.getItem("vc_user_name") || "");
  const [cartLoaded, setCartLoaded] = useState(false);

  const login = (email, name = "") => {
    setUserEmail(email);
    setUserName(name);
    localStorage.setItem("vc_user_email", email);
    localStorage.setItem("vc_user_name", name);
  };

  const logout = () => {
    setUserEmail("");
    setUserName("");
    setItems([]);
    setAppliedOffers({});
    localStorage.removeItem("vc_user_email");
    localStorage.removeItem("vc_user_name");
  };

  useEffect(() => {
    if (!userEmail) {
      setCartLoaded(true);
      return;
    }
    axios.get(`/cart/${encodeURIComponent(userEmail)}`)
      .then(res => {
        const data = res.data;
        setItems(data.items || []);
        setAppliedOffers(data.appliedOffers || {});
      })
      .catch(() => {})
      .finally(() => setCartLoaded(true));
  }, [userEmail]);

  const saveCartToBackend = useCallback((currentItems, currentOffers) => {
    if (!userEmail) return;
    axios.put(`/cart/${encodeURIComponent(userEmail)}`, {
      items: currentItems,
      appliedOffers: currentOffers
    }).catch(() => {});
  }, [userEmail]);

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
    setAppliedOffers(prev => {
      const n = { ...prev };
      delete n[productId];
      return n;
    });
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
    setAppliedOffers(prev => {
      const n = { ...prev };
      delete n[productId];
      return n;
    });
  };

  const clearCart = () => {
    setItems([]);
    setAppliedOffers({});
    if (userEmail) {
      axios.delete(`/cart/${encodeURIComponent(userEmail)}`).catch(() => {});
    }
  };

  const applyOffer = (productId, offerData) => {
    setAppliedOffers(prev => ({ ...prev, [productId]: offerData }));
  };

  // Sync to backend after state changes
  const prevItemsRef = useRef(items);
  const prevOffersRef = useRef(appliedOffers);
  useEffect(() => {
    if (!cartLoaded || !userEmail) {
      prevItemsRef.current = items;
      prevOffersRef.current = appliedOffers;
      return;
    }
    if (prevItemsRef.current !== items || prevOffersRef.current !== appliedOffers) {
      prevItemsRef.current = items;
      prevOffersRef.current = appliedOffers;
      saveCartToBackend(items, appliedOffers);
    }
  }, [items, appliedOffers, cartLoaded, userEmail, saveCartToBackend]);

  return (
    <CartContext.Provider value={{ items, appliedOffers, userEmail, userName, cartLoaded, addToCart, removeFromCart, updateQuantity, clearCart, applyOffer, login, logout }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
