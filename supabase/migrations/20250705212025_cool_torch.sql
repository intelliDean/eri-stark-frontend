/*
  # Create notifications system for new Supabase project

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `recipient_address` (text, wallet address of recipient)
      - `sender_address` (text, wallet address of sender)
      - `type` (text, notification type)
      - `title` (text, notification title)
      - `message` (text, notification message)
      - `data` (jsonb, additional notification data)
      - `read` (boolean, read status)
      - `created_at` (timestamp)
      - `action_url` (text, optional action URL)
      - `action_label` (text, optional action label)

  2. Security
    - Enable RLS on `notifications` table
    - Add policies for reading, creating, updating, and deleting notifications

  3. Indexes
    - Add indexes for better performance on common queries
*/

-- Create the notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_address text NOT NULL,
  sender_address text NOT NULL,
  type text NOT NULL DEFAULT 'general',
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  action_url text,
  action_label text
);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications access
-- Allow anyone to read notifications (for our wallet-based system)
CREATE POLICY "Allow read access to notifications"
  ON notifications
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow anyone to create notifications
CREATE POLICY "Allow insert access to notifications"
  ON notifications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anyone to update notifications (for marking as read)
CREATE POLICY "Allow update access to notifications"
  ON notifications
  FOR UPDATE
  TO anon, authenticated
  USING (true);

-- Allow anyone to delete notifications
CREATE POLICY "Allow delete access to notifications"
  ON notifications
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_address ON notifications(recipient_address);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Insert a test notification to verify the table works
INSERT INTO notifications (
  recipient_address,
  sender_address,
  type,
  title,
  message,
  data,
  action_url,
  action_label
) VALUES (
  '0x03bab821ff91cdbfbd6a1a40c6e22cba67260e33df5f0a5c49fda4e8438689f4',
  '0x07578a12feeef94a02613ef3e8f21c828c4ee206f0d46c4829f916cc707d5244',
  'ownership_transfer',
  'Test Notification',
  'This is a test notification to verify the table is working',
  '{"itemId": "test-item", "itemName": "Test Product"}',
  '#claim-ownership',
  'Claim Ownership'
);