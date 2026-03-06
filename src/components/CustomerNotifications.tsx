"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, ChefHat, CheckCircle, Package } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface CustomerNotification {
  id: string;
  type: "preparing" | "ready" | "served";
  tableNumber: string;
  customerName: string;
  message: string;
  timestamp: number;
}

interface NotificationProps {
  notification: CustomerNotification;
  onRemove: (id: string) => void;
}

function CustomerNotificationItem({ notification, onRemove }: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(notification.id);
    }, 8000); // Auto-dismiss after 8 seconds

    return () => clearTimeout(timer);
  }, [notification.id, onRemove]);

  const getNotificationIcon = () => {
    switch (notification.type) {
      case "preparing":
        return <ChefHat className="w-5 h-5 text-orange-400" />;
      case "ready":
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "served":
        return <Package className="w-5 h-5 text-blue-400" />;
      default:
        return <Clock className="w-5 h-5 text-white/40" />;
    }
  };

  const getNotificationColor = () => {
    switch (notification.type) {
      case "preparing":
        return "bg-orange-900/20 border-orange-500/30";
      case "ready":
        return "bg-green-900/20 border-green-500/30";
      case "served":
        return "bg-blue-900/20 border-blue-500/30";
      default:
        return "bg-white/10 border-white/20";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`flex items-start gap-4 p-5 rounded-2xl border backdrop-blur-xl shadow-2xl ${getNotificationColor()} min-w-[340px] max-w-sm cursor-pointer hover:scale-105 transition-transform group`}
      onClick={() => onRemove(notification.id)}
    >
      <div className="flex-shrink-0 mt-1">
        {getNotificationIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white/80 text-[11px] font-bold uppercase tracking-widest mb-1 flex items-center justify-between">
          <span>Message from Abhiruchi</span>
          <span className="text-white/40 font-normal normal-case">{new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </p>
        <p className="text-white text-base font-semibold leading-tight">{notification.message}</p>
        <p className="text-white/40 text-[10px] mt-3 group-hover:text-white/70 transition-colors uppercase tracking-widest">Tap anywhere to dismiss</p>
      </div>
    </motion.div>
  );
}

export function CustomerNotificationContainer() {
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);

  const addNotification = (type: "preparing" | "ready" | "served", tableNumber: string, customerName: string) => {
    const messages = {
      preparing: `🍳 Your order is being prepared!`,
      ready: `✅ Your order is ready for pickup!`,
      served: `🎉 Enjoy Your Meal!`
    };

    const id = Date.now().toString();
    const notification: CustomerNotification = {
      id,
      type,
      tableNumber,
      customerName,
      message: messages[type],
      timestamp: Date.now()
    };

    setNotifications(prev => [...prev, notification]);

    // Also play a subtle sound
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Fallback to vibration if available
        if ('vibrate' in navigator) {
          navigator.vibrate([100]);
        }
      });
    } catch (error) {
      console.log('Customer notification sound failed');
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Expose function globally for admin/local calls
  useEffect(() => {
    (window as any).addCustomerNotification = addNotification;
  }, []);

  // Listen globally to Supabase table changes for the current customer mapping
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // We only care if They are a customer (not an admin on the admin panel)
    const isAdmin = window.location.pathname.includes('/admin');
    if (isAdmin) return;

    const subscription = supabase
      .channel('global-customer-notifications')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
      }, (payload) => {
        // Always fetch the freshest values inside the callback in case they just checked out without a hard refresh
        const table = localStorage.getItem('last_table_number');
        const customer = localStorage.getItem('last_customer_name');

        if (!table || !customer) return;

        // We ensure it's THEIR order
        if (
          (payload.new.table_number === table || (table === 'Parcel' && payload.new.order_type === 'Parcel')) &&
          payload.new.customer_name === customer
        ) {
          const status = payload.new.order_status.toLowerCase();
          if (['preparing', 'ready', 'served'].includes(status)) {
            addNotification(status as any, table, customer);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 pointer-events-none w-full max-w-sm px-4">
      <AnimatePresence>
        {notifications.map(notification => (
          <div key={notification.id} className="pointer-events-auto mx-auto w-full">
            <CustomerNotificationItem notification={notification} onRemove={removeNotification} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Hook for customers to subscribe to their order updates
export function useOrderNotifications(tableNumber: string, customerName: string) {
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);

  useEffect(() => {
    // Listen for customer notifications
    const handleNotification = (event: CustomEvent) => {
      const { type, table: orderTable, customer } = event.detail;
      if (orderTable === tableNumber && customer === customerName) {
        const messages: Record<string, string> = {
          preparing: `🍳 Your order is being prepared!`,
          ready: `✅ Your order is ready for pickup!`,
          served: `🎉 Enjoy Your Meal!`
        };

        const notification: CustomerNotification = {
          id: Date.now().toString(),
          type: type as "preparing" | "ready" | "served",
          tableNumber: orderTable,
          customerName: customer,
          message: messages[type] || `Your order status has been updated.`,
          timestamp: Date.now()
        };

        setNotifications(prev => [...prev, notification]);
      }
    };

    window.addEventListener('customerOrderUpdate', handleNotification as EventListener);
    return () => window.removeEventListener('customerOrderUpdate', handleNotification as EventListener);
  }, [tableNumber, customerName]);

  return { notifications, clearNotifications: () => setNotifications([]) };
}
