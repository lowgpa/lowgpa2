// Replace these with your actual Supabase URL and Anon Key
const SUPABASE_URL = 'https://qizawgmqgyedywpaaqxn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_nZFqAqKl-sO8vzAqRBnGmA_GHbP8DaZ';

// Initialize the Supabase client
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabaseClient = supabaseClient;
