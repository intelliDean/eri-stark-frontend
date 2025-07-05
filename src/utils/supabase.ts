import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase Configuration:');
console.log('- URL:', supabaseUrl || 'Missing');
console.log('- Anon Key:', supabaseAnonKey ? 'Set (length: ' + supabaseAnonKey.length + ')' : 'Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!');
  console.error('VITE_SUPABASE_URL:', supabaseUrl);
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Present' : 'Missing');
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Validate URL format
if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
  console.error('Invalid Supabase URL format:', supabaseUrl);
  throw new Error('Invalid Supabase URL format. Expected format: https://your-project.supabase.co');
}

// Create Supabase client with additional options for better error handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false // Since we're not using Supabase auth
  },
  global: {
    headers: {
      'X-Client-Info': 'eri-platform'
    }
  }
});

// Test the connection on initialization
supabase
  .from('notifications')
  .select('count')
  .limit(1)
  .then(({ data, error }) => {
    if (error) {
      console.error('Supabase connection test failed:', error);
    } else {
      console.log('Supabase connection test successful');
    }
  })
  .catch((error) => {
    console.error('Supabase connection test error:', error);
  });

export interface DatabaseNotification {
  id: string;
  recipient_address: string;
  sender_address: string;
  type: string;
  title: string;
  message: string;
  data: any;
  read: boolean;
  created_at: string;
  action_url?: string;
  action_label?: string;
}