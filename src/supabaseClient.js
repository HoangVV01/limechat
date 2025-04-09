import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://fhcqusiuzzhplujlidju.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoY3F1c2l1enpocGx1amxpZGp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwMDIxMDMsImV4cCI6MjA1NzU3ODEwM30.imGkejNqZpVrmTTJX1yda0eR22xK3IAlt72zpP4IJ3E";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
