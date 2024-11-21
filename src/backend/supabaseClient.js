import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

//const supabaseUrl = process.env.SUPABASE_URL; // the problem is process.env isn't loading anything fromt the .env file because 'process' is not defined.eslintno-undef
//onst supabaseUrl = import.meta.env.VITE_SUPABASE_URL;


//const supabaseAnonKey = process.env.SUPABASE_KEY;
//const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const jwt =process.env.JWT_SECRET;

if (!supabaseUrl || !supabaseAnonKey) {
  
  throw new Error('Supabase URL or Anon Key is missing from environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
//const secret = jwt;
export default { supabase, secret: jwt }; // Default export an object
