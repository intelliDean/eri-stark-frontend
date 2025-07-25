import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useWallet } from './WalletContext';
import { supabase, DatabaseNotification } from '../utils/supabase';

export interface Notification {
  id: string;
  type: 'ownership_transfer' | 'ownership_claimed' | 'transfer_code_generated' | 'general';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  data?: {
    itemId?: string;
    itemName?: string;
    fromUser?: string;
    fromAddress?: string;
    toAddress?: string;
    transferCode?: string;
    claimUrl?: string;
    revokeUrl?: string;
  };
  actionUrl?: string;
  actionLabel?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
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
  ) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);
// Normalize address format to ensure consistent matching
const normalizeAddress = (address: string): string => {
  if (!address) return address;
  
  // For Starknet addresses, we need to handle both short and long formats
  // Remove 0x prefix and convert to lowercase
  let cleanAddress = address.replace('0x', '').toLowerCase();
  
  // If address is shorter than 64 characters, pad with zeros
  if (cleanAddress.length < 64) {
    cleanAddress = cleanAddress.padStart(64, '0');
  }
  
  return `0x${cleanAddress}`;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address } = useWallet();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  // Convert database notification to app notification
  const convertDbNotification = (dbNotification: DatabaseNotification): Notification => ({
    id: dbNotification.id,
    type: dbNotification.type as any,
    title: dbNotification.title,
    message: dbNotification.message,
    timestamp: new Date(dbNotification.created_at).getTime(),
    read: dbNotification.read,
    data: dbNotification.data,
    actionUrl: dbNotification.action_url,
    actionLabel: dbNotification.action_label,
  });

  // Load notifications from Supabase
  const loadNotifications = async () => {
    if (!address) return;

    setLoading(true);
    try {
      console.log('Loading notifications for address:', address);
      
      // Query for both original and normalized address to catch all notifications
      const normalizedAddress = normalizeAddress(address);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`recipient_address.eq.${address},recipient_address.eq.${normalizedAddress}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading notifications:', error);
        toast.error('Failed to load notifications');
        return;
      }

      console.log('Raw notifications from database:', data);
      
      const convertedNotifications = data.map(convertDbNotification);
      console.log('Converted notifications:', convertedNotifications);
      setNotifications(convertedNotifications);
      
      if (convertedNotifications.length > 0) {
        console.log(`Loaded ${convertedNotifications.length} notifications`);
      } else {
        console.log('No notifications found for this address');
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // Load notifications when wallet connects
  useEffect(() => {
    if (address) {
      console.log('Wallet connected, loading notifications for:', address);
      loadNotifications();
    } else {
      console.log('Wallet disconnected, clearing notifications');
      setNotifications([]);
    }
  }, [address]);

  // Set up real-time subscription for new notifications
  useEffect(() => {
    if (!address) return;

    console.log('Setting up real-time subscription for:', address);
    
    const normalizedAddress = normalizeAddress(address);
    console.log('Setting up subscription for normalized address:', normalizedAddress);
    
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_address=eq.${normalizedAddress}`,
        },
        (payload) => {
          console.log('Real-time notification received:', payload);
          const newNotification = convertDbNotification(payload.new as DatabaseNotification);
          setNotifications(prev => [newNotification, ...prev]);
          
          // Show toast notification
          toast.info(newNotification.title, {
            onClick: () => {
              if (newNotification.actionUrl) {
                handleNotificationAction(newNotification);
              }
            }
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_address=eq.${normalizedAddress}`,
        },
        (payload) => {
          console.log('Real-time notification update:', payload);
          const updatedNotification = convertDbNotification(payload.new as DatabaseNotification);
          setNotifications(prev =>
            prev.map(notification =>
              notification.id === updatedNotification.id ? updatedNotification : notification
            )
          );
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [address]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationAction = (notification: Notification) => {
    if (notification.actionUrl) {
      const url = notification.actionUrl.replace('#', '');
      
      if (url === 'claim-ownership') {
        window.dispatchEvent(new CustomEvent('navigate-to-feature', {
          detail: { 
            page: 'user', 
            feature: 'claim-ownership',
            data: notification.data
          }
        }));
      } else if (url === 'revoke-code') {
        // Navigate to revoke code page with transfer code data
        window.dispatchEvent(new CustomEvent('navigate-to-feature', {
          detail: { 
            page: 'user', 
            feature: 'revoke-code',
            data: notification.data
          }
        }));
        // Note: onClose is handled by the NotificationCenter component
      }
    }
  };

  const addNotification = async (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    if (!address) return;

    const normalizedAddress = normalizeAddress(address);
    
    console.log('=== ADD NOTIFICATION START ===');
    console.log('Current user address:', address);
    console.log('Normalized address:', normalizedAddress);
    console.log('Notification data:', notification);
    
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          recipient_address: normalizedAddress,
          sender_address: normalizedAddress,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data || {},
          action_url: notification.actionUrl,
          action_label: notification.actionLabel,
        });

      if (error) {
        console.error('Error adding notification:', error);
        toast.error('Failed to add notification');
        return;
      }
      
      console.log('Notification added successfully to database');
      console.log('=== ADD NOTIFICATION END ===');
    } catch (error) {
      console.error('Error adding notification:', error);
      toast.error('Failed to add notification');
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }

      setNotifications(prev =>
        prev.map(notification =>
          notification.id === id ? { ...notification, read: true } : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!address) return;

    const normalizedAddress = normalizeAddress(address);
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('recipient_address', normalizedAddress)
        .eq('read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return;
      }

      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const removeNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error removing notification:', error);
        return;
      }

      setNotifications(prev => prev.filter(notification => notification.id !== id));
    } catch (error) {
      console.error('Error removing notification:', error);
    }
  };

  const clearAllNotifications = async () => {
    if (!address) return;

    const normalizedAddress = normalizeAddress(address);
    
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('recipient_address', normalizedAddress);

      if (error) {
        console.error('Error clearing notifications:', error);
        return;
      }

      setNotifications([]);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const sendOwnershipTransferNotification = async (
    recipientAddress: string,
    itemId: string,
    itemName: string,
    senderAddress: string,
    transferCode: string
  ) => {
    console.log('=== SEND OWNERSHIP TRANSFER NOTIFICATION START ===');
    console.log('Recipient address (user B):', recipientAddress);
    console.log('Sender address (user A):', senderAddress);
    console.log('Item details:', { itemId, itemName, transferCode });
    
    try {
      // Normalize recipient address to ensure proper matching
      const normalizedRecipient = normalizeAddress(recipientAddress);
      const normalizedSender = normalizeAddress(senderAddress);
      console.log('Normalized recipient address:', normalizedRecipient);
      console.log('Normalized sender address:', normalizedSender);

      const { error } = await supabase
        .from('notifications')
        .insert({
          recipient_address: normalizedRecipient, // Use normalized address for consistency
          sender_address: normalizedSender,
          type: 'ownership_transfer',
          title: 'New Ownership Transfer',
          message: `You have received ownership transfer for "${itemName}"`,
          data: {
            itemId,
            itemName,
            fromAddress: senderAddress,
            transferCode,
            claimUrl: '#claim-ownership'
          },
          action_url: '#claim-ownership',
          action_label: 'Claim Ownership'
        });

      if (error) {
        console.error('Error sending notification:', error);
        toast.error('Failed to send notification');
        return;
      }

      console.log('Ownership transfer notification sent successfully to recipient');
      console.log('=== SEND OWNERSHIP TRANSFER NOTIFICATION END ===');
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    }
  };

  const refreshNotifications = async () => {
    await loadNotifications();
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      addNotification,
      markAsRead,
      markAllAsRead,
      removeNotification,
      clearAllNotifications,
      sendOwnershipTransferNotification,
      refreshNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  console.log('=== USE NOTIFICATIONS HOOK CALLED ===');
  const context = useContext(NotificationContext);
  if (context === undefined) {
    console.error('useNotifications called outside of NotificationProvider');
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  console.log('useNotifications context:', {
    hasAddNotification: typeof context.addNotification === 'function',
    notificationCount: context.notifications.length,
    unreadCount: context.unreadCount,
    loading: context.loading
  });
  return context;
};