
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://paqxvlqcyqmhoodaxqqp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcXh2bHFjeXFtaG9vZGF4cXFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2Mzk2NDMsImV4cCI6MjA3OTIxNTY0M30.dkLNmU0B_Nswt4jwhZouvxiQgirXeyYi2F5I7S1PATs'


// Database Types
export interface Category {
  id: string;
  name: string;
  created_at: string;
}

export interface Ingredient {
  id: string;
  name: string;
  emoji: string;
  category_id: string;
  image_url?: string;
  is_popular?: boolean;
  created_at: string;
}


export const supabase = createClient(supabaseUrl, supabaseKey)