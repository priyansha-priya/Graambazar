import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Seller } from '../types/merchant';
import { useVillage } from './VillageContext';

export interface CartLineItem {
  id: string; // unique cart item id
  productId: string;
  productName: string;
  sellerId: string;
  sellerName: string;
  catalogueType: 'FOOD' | 'GROCERY';
  unitLabel: string;
  unitPricePaise: number;
  quantity: number;
  lineTotalPaise: number;
  customerNote?: string;
}

interface CartContextType {
  seller: Seller | null;
  items: CartLineItem[];
  fulfilmentMode: 'DELIVERY' | 'PICKUP';
  setFulfilmentMode: (mode: 'DELIVERY' | 'PICKUP') => void;
  addItem: (item: Omit<CartLineItem, 'id'>, seller: Seller) => { success: boolean; conflictSeller?: Seller };
  forceAddItem: (item: Omit<CartLineItem, 'id'>, seller: Seller) => void;
  updateQuantity: (cartItemId: string, newQty: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  itemSubtotalPaise: number;
  deliveryFeePaise: number;
  packagingFeePaise: number;
  platformFeePaise: number;
  totalPaise: number;
  isMinimumOrderMet: boolean;
  minOrderShortfallPaise: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { getDeliveryRelationship } = useVillage();

  const [seller, setSeller] = useState<Seller | null>(() => {
    const saved = localStorage.getItem('grambazaar_cart_seller');
    return saved ? JSON.parse(saved) : null;
  });

  const [items, setItems] = useState<CartLineItem[]>(() => {
    const saved = localStorage.getItem('grambazaar_cart_items');
    return saved ? JSON.parse(saved) : [];
  });

  const [fulfilmentMode, setFulfilmentMode] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY');

  useEffect(() => {
    if (seller) {
      localStorage.setItem('grambazaar_cart_seller', JSON.stringify(seller));
    } else {
      localStorage.removeItem('grambazaar_cart_seller');
    }
  }, [seller]);

  useEffect(() => {
    localStorage.setItem('grambazaar_cart_items', JSON.stringify(items));
    if (items.length === 0) {
      setSeller(null);
    }
  }, [items]);

  // Single-seller cart guard
  const addItem = (item: Omit<CartLineItem, 'id'>, itemSeller: Seller) => {
    if (seller && seller.id !== itemSeller.id && items.length > 0) {
      return { success: false, conflictSeller: seller };
    }

    if (!seller) {
      setSeller(itemSeller);
    }

    const newItem: CartLineItem = {
      ...item,
      id: `${item.productId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };

    setItems((prev) => [...prev, newItem]);
    return { success: true };
  };

  const forceAddItem = (item: Omit<CartLineItem, 'id'>, itemSeller: Seller) => {
    setSeller(itemSeller);
    const newItem: CartLineItem = {
      ...item,
      id: `${item.productId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };
    setItems([newItem]);
  };

  const updateQuantity = (cartItemId: string, newQty: number) => {
    if (newQty <= 0) {
      removeItem(cartItemId);
      return;
    }

    setItems((prev) =>
      prev.map((i) => {
        if (i.id === cartItemId) {
          const unitPrice = i.unitPricePaise;
          return {
            ...i,
            quantity: newQty,
            lineTotalPaise: Math.round(unitPrice * newQty),
          };
        }
        return i;
      })
    );
  };

  const removeItem = (cartItemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== cartItemId));
  };

  const clearCart = () => {
    setItems([]);
    setSeller(null);
  };

  // Financial calculations in integer paise
  const itemSubtotalPaise = items.reduce((acc, curr) => acc + curr.lineTotalPaise, 0);

  const deliveryRelationship = seller ? getDeliveryRelationship(seller) : null;
  const baseDeliveryFee = deliveryRelationship ? deliveryRelationship.deliveryFeePaise : 0;
  const deliveryFeePaise = fulfilmentMode === 'PICKUP' ? 0 : baseDeliveryFee;

  const packagingFeePaise = seller ? seller.packagingFeePaise : 0;
  const platformFeePaise = 0; // ₹0 during pilot launch

  const totalPaise = itemSubtotalPaise + deliveryFeePaise + packagingFeePaise + platformFeePaise;

  const minimumOrderPaise = seller ? seller.minimumOrderPaise : 0;
  const isMinimumOrderMet = itemSubtotalPaise >= minimumOrderPaise;
  const minOrderShortfallPaise = Math.max(0, minimumOrderPaise - itemSubtotalPaise);

  return (
    <CartContext.Provider
      value={{
        seller,
        items,
        fulfilmentMode,
        setFulfilmentMode,
        addItem,
        forceAddItem,
        updateQuantity,
        removeItem,
        clearCart,
        itemSubtotalPaise,
        deliveryFeePaise,
        packagingFeePaise,
        platformFeePaise,
        totalPaise,
        isMinimumOrderMet,
        minOrderShortfallPaise,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
