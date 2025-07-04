import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useWallet } from './WalletContext';

export interface Notification {
  id: string;
  type: 'ownership_transfer' | 'ownership_claimed' | 'general';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  data?: {
    itemId?: string;
    itemName?: string;
    fromUser?: string;
    fromAddress?: string;
    transferCode?: string;
    claimUrl?: string;
  };
  actionUrl?: string;
  actionLabel?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  sendOwnershipTransferNotification: (
    recipientAddress: string,
    itemId: string,
    itemName: string,
    senderAddress: string,
    transferCode: string
  ) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address } = useWallet();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load notifications from localStorage on mount
  useEffect(() => {
    if (address) {
      const stored = localStorage.getItem(`notifications_${address}`);
      if (stored) {
        try {
          const parsedNotifications = JSON.parse(stored);
          setNotifications(parsedNotifications);
        } catch (error) {
          console.error('Error loading notifications:', error);
        }
      }
    }
  }, [address]);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (address && notifications.length > 0) {
      localStorage.setItem(`notifications_${address}`, JSON.stringify(notifications));
    }
  }, [notifications, address]);

  // Clear notifications when wallet disconnects
  useEffect(() => {
    if (!address) {
      setNotifications([]);
    }
  }, [address]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);
    
    // Show toast notification
    toast.info(notification.title, {
      onClick: () => {
        if (notification.actionUrl) {
          window.location.hash = notification.actionUrl;
        }
      }
    });
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    if (address) {
      localStorage.removeItem(`notifications_${address}`);
    }
  };

  const sendOwnershipTransferNotification = (
    recipientAddress: string,
    itemId: string,
    itemName: string,
    senderAddress: string,
    transferCode: string
  ) => {
    // In a real app, this would send to a backend service
    // For now, we'll simulate by storing in localStorage for the recipient
    const notification: Notification = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type: 'ownership_transfer',
      title: 'New Ownership Transfer',
      message: `You have received ownership transfer for "${itemName}"`,
      timestamp: Date.now(),
      read: false,
      data: {
        itemId,
        itemName,
        fromAddress: senderAddress,
        transferCode,
        claimUrl: '#claim-ownership'
      },
      actionUrl: '#claim-ownership',
      actionLabel: 'Claim Ownership'
    };

    // Store notification for recipient
    const existingNotifications = localStorage.getItem(`notifications_${recipientAddress}`);
    let recipientNotifications: Notification[] = [];
    
    if (existingNotifications) {
      try {
        recipientNotifications = JSON.parse(existingNotifications);
      } catch (error) {
        console.error('Error parsing recipient notifications:', error);
      }
    }

    recipientNotifications.unshift(notification);
    localStorage.setItem(`notifications_${recipientAddress}`, JSON.stringify(recipientNotifications));

    // If the recipient is the current user, add to current notifications
    if (recipientAddress === address) {
      setNotifications(prev => [notification, ...prev]);
      toast.info('You have received an ownership transfer!');
    }

    toast.success('Ownership transfer notification sent successfully!');
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      removeNotification,
      clearAllNotifications,
      sendOwnershipTransferNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};