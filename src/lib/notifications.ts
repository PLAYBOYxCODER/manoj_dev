// Notification helper for admin alerts
// This file handles browser notifications for new orders

export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        console.log('Notification permission granted');
      }
    });
  }
}

export function showOrderNotification(tableNumber: string, customerName: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification('🍽️ New Order Received!', {
      body: `Table ${tableNumber} - ${customerName}`,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `order-${tableNumber}-${Date.now()}`,
      requireInteraction: true
    });

    notification.onclick = function() {
      window.open('/admin', '_blank');
      notification.close();
    };

    // Auto close after 10 seconds
    setTimeout(() => {
      notification.close();
    }, 10000);
  }
}

export function showFeedbackNotification(customerName: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification('💬 New Feedback Received!', {
      body: `From ${customerName || 'Anonymous'}`,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `feedback-${Date.now()}`,
      requireInteraction: false
    });

    notification.onclick = function() {
      window.open('/admin', '_blank');
      notification.close();
    };

    // Auto close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);
  }
}
