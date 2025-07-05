import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase Configuration:');
console.log('- URL:', supabaseUrl ? 'Set' : 'Missing');
console.log('- Anon Key:', supabaseAnonKey ? 'Set' : 'Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!');
  console.error('VITE_SUPABASE_URL:', supabaseUrl);
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Present' : 'Missing');
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test the connection with a simple query that doesn't depend on specific tables
supabase.rpc('version')
  .then(({ data, error }) => {
    if (error) {
      console.warn('Supabase connection test failed:', error.message);
      console.log('This might be expected if database migrations haven\'t been applied yet.');
    } else {
      console.log('Supabase connection successful.');
    }
  })
  .catch(err => {
    console.warn('Supabase connection error:', err.message);
    console.log('Please ensure your Supabase project is set up and migrations are applied.');
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