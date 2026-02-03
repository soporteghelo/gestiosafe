
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CartItem, Template } from '../types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (template: Template) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = useCallback((template: Template) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === template.id);
      if (existing) {
        return prev.map(item => 
          item.id === template.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...template, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, total, itemCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
