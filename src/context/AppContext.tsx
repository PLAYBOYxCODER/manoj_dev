"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type CartItem = {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
};

interface AppContextType {
    cart: CartItem[];
    addToCart: (item: CartItem) => void;
    removeFromCart: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    tableNumber: string | null;
    setTableNumber: (number: string) => void;
    isCartOpen: boolean;
    setIsCartOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [tableNumber, setTableNumber] = useState<string | null>(null);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Load from local storage on mount
    useEffect(() => {
        const syncTable = () => {
            const savedTable = localStorage.getItem("tableNumber");
            if (savedTable) setTableNumber(savedTable);
        };

        syncTable();

        const savedCart = localStorage.getItem("cart");
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (savedCart) setCart(JSON.parse(savedCart));

        window.addEventListener('storage', syncTable);
        return () => window.removeEventListener('storage', syncTable);
    }, []);

    // Save changes to local storage
    useEffect(() => {
        localStorage.setItem("cart", JSON.stringify(cart));
    }, [cart]);

    useEffect(() => {
        if (tableNumber) localStorage.setItem("tableNumber", tableNumber);
    }, [tableNumber]);

    const addToCart = (item: CartItem) => {
        setCart((prev) => {
            const existing = prev.find((i) => i.id === item.id);
            if (existing) {
                return prev.map((i) =>
                    i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
                );
            }
            return [...prev, item];
        });
        setIsCartOpen(true);
    };

    const removeFromCart = (id: string) => {
        setCart((prev) => prev.filter((i) => i.id !== id));
    };

    const updateQuantity = (id: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(id);
            return;
        }
        setCart((prev) =>
            prev.map((i) => (i.id === id ? { ...i, quantity } : i))
        );
    };

    const clearCart = () => setCart([]);

    return (
        <AppContext.Provider
            value={{
                cart,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                tableNumber,
                setTableNumber,
                isCartOpen,
                setIsCartOpen,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("useAppContext must be used within AppProvider");
    return context;
};
