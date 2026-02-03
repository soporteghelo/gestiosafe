import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Tipo para un item comprado
export interface PurchasedItem {
  id: string;
  name: string;
  description: string;
  price: number;
  link: string;
  imageUrl: string;
  category: string;
}

// Tipo para una compra
export interface Purchase {
  id: string;
  paymentId: string;
  items: PurchasedItem[];
  total: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  date: string;
}

interface PurchaseHistoryContextType {
  purchases: Purchase[];
  addPurchase: (purchase: Omit<Purchase, 'id' | 'date'>) => void;
  getPurchaseByPaymentId: (paymentId: string) => Purchase | undefined;
  clearHistory: () => void;
  hasPurchases: boolean;
}

const PurchaseHistoryContext = createContext<PurchaseHistoryContextType | undefined>(undefined);

const SESSION_STORAGE_KEY = 'gestiosafe_purchase_history';

export const PurchaseHistoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  // Cargar historial de sessionStorage al inicio
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setPurchases(parsed);
        console.log('📜 Historial de compras cargado:', parsed.length, 'compras');
      }
    } catch (error) {
      console.error('Error cargando historial:', error);
    }
  }, []);

  // Guardar en sessionStorage cuando cambie
  useEffect(() => {
    if (purchases.length > 0) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(purchases));
    }
  }, [purchases]);

  const addPurchase = (purchaseData: Omit<Purchase, 'id' | 'date'>) => {
    // Verificar que no exista ya
    const exists = purchases.some(p => p.paymentId === purchaseData.paymentId);
    if (exists) {
      console.log('⚠️ Compra ya registrada:', purchaseData.paymentId);
      return;
    }

    const newPurchase: Purchase = {
      ...purchaseData,
      id: `purchase_${Date.now()}`,
      date: new Date().toISOString()
    };

    setPurchases(prev => [...prev, newPurchase]);
    console.log('✅ Nueva compra registrada:', newPurchase);
  };

  const getPurchaseByPaymentId = (paymentId: string) => {
    return purchases.find(p => p.paymentId === paymentId);
  };

  const clearHistory = () => {
    setPurchases([]);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  };

  return (
    <PurchaseHistoryContext.Provider value={{
      purchases,
      addPurchase,
      getPurchaseByPaymentId,
      clearHistory,
      hasPurchases: purchases.length > 0
    }}>
      {children}
    </PurchaseHistoryContext.Provider>
  );
};

export const usePurchaseHistory = () => {
  const context = useContext(PurchaseHistoryContext);
  if (!context) {
    throw new Error('usePurchaseHistory debe usarse dentro de PurchaseHistoryProvider');
  }
  return context;
};
