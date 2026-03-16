import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gelngkrfmbzjpbhesexd.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlbG5na3JmbWJ6anBiaGVzZXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNDg0NjYsImV4cCI6MjA4ODcyNDQ2Nn0.eUhEApnCRi_zYRZMSiyrNOwXz5DZfPEQz0CYS8dZWdM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)