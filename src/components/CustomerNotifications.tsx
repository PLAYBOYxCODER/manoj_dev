"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, ChefHat, CheckCircle, Package } from "lucide-react";

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
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`flex items-center gap-3 p-4 rounded-xl border backdrop-blur-sm shadow-lg ${getNotificationColor()} min-w-[320px] max-w-md cursor-pointer hover:scale-105 transition-transform`}
      onClick={() => onRemove(notification.id)}
    >
      <div className="flex-shrink-0">
        {getNotificationIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-white font-semibold text-sm">Table {notification.tableNumber}</span>
          <span className="text-white/50 text-xs">•</span>
          <span className="text-white/50 text-xs">{new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <p className="text-white/90 text-sm font-medium">{notification.message}</p>
        <p className="text-white/60 text-xs mt-1">Tap to dismiss</p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(notification.id);
        }}
        className="text-white/40 hover:text-white transition-colors flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
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

  // Expose function globally for admin to call
  useEffect(() => {
    (window as any).addCustomerNotification = addNotification;
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {notifications.map(notification => (
          <div key={notification.id} className="pointer-events-auto">
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
