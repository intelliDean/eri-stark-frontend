import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useWallet } from './WalletContext';
import { supabase, DatabaseNotification } from '../utils/supabase';

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
      // Normalize address format - ensure it has proper padding
      const normalizedAddress = address.startsWith('0x') 
        ? '0x' + address.slice(2).padStart(64, '0')
        : address;
      
      console.log('Loading notifications for address:', address);
      console.log('Normalized address:', normalizedAddress);
      
      // Debug: Check all notifications first
      const { data: allNotifications, error: allError } = await supabase
        .from('notifications')
        .select('*')
        .limit(50);
        
      if (allError) {
        console.error('Error fetching all notifications:', allError);
      } else {
        console.log('All notifications in database:', allNotifications);
        console.log('Available recipient addresses:', allNotifications?.map(n => n.recipient_address));
        console.log('Your address:', address);
        console.log('Address matches:', allNotifications?.filter(n => n.recipient_address === address));
      }
      
      // Try both the original address and normalized address
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`recipient_address.eq.${address},recipient_address.eq.${normalizedAddress}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error loading notifications:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        toast.error('Failed to load notifications');
        return;
      }

      console.log('Raw notifications from database:', data);
      console.log('Query used: recipient_address =', address, 'OR', normalizedAddress);
      
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

    // Normalize address for subscription
    const normalizedAddress = address.startsWith('0x') 
      ? '0x' + address.slice(2).padStart(64, '0')
      : address;

    console.log('Setting up real-time subscription for:', address);
    console.log('Normalized subscription address:', normalizedAddress);
    
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_address=eq.${address}`,
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
          filter: `recipient_address=eq.${address}`,
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
      }
    }
  };

  const addNotification = async (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    if (!address) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          recipient_address: address,
          sender_address: address,
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
      }
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

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('recipient_address', address)
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

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('recipient_address', address);

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
    try {
      // Normalize recipient address format
      const normalizedRecipientAddress = recipientAddress.startsWith('0x') 
        ? '0x' + recipientAddress.slice(2).padStart(64, '0')
        : recipientAddress;
      
      const normalizedSenderAddress = senderAddress.startsWith('0x') 
        ? '0x' + senderAddress.slice(2).padStart(64, '0')
        : senderAddress;
      
      
      // Validate inputs
      if (!recipientAddress || !senderAddress || !itemName) {
        console.error('Missing required notification data');
        toast.error('Missing required data for notification');
        return;
      }
      
      const notificationData = {
        recipient_address: normalizedRecipientAddress,
        sender_address: normalizedSenderAddress,
        type: 'ownership_transfer',
        title: 'New Ownership Transfer',
        message: `You have received ownership transfer for "${itemName}"`,
        data: {
          itemId,
          itemName,
          fromAddress: normalizedSenderAddress,
          transferCode,
          claimUrl: '#claim-ownership'
        },
        action_url: '#claim-ownership',
        action_label: 'Claim Ownership'
      };
      
      const { data: insertResult, error } = await supabase
        .from('notifications')
        .insert(notificationData)
        .select();

      if (error) {
        console.error('Supabase error sending notification:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        toast.error('Failed to send notification');
        return;
      }

      toast.success('Ownership transfer notification sent successfully!');
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
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};