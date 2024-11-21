import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

//process keys and urls from .env file
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const jwt =process.env.JWT_SECRET;

// catching if supabase client are fetched properly
if (!supabaseUrl || !supabaseAnonKey) {
  
  throw new Error('Supabase URL or Anon Key is missing from environment variables');
}
//initialization of the supabase client server
const supabase = createClient(supabaseUrl, supabaseAnonKey);
//const secret = jwt;
export default { supabase, secret: jwt }; // Default export an object
