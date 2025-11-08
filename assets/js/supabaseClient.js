// ===============================
// 🧠 SUPABASE CLIENT GLOBAL
// ===============================

const SUPABASE_URL = "https://dpmqzuvyygwreqpffpca.supabase.co";
const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwbXF6dXZ5eWd3cmVxcGZmcGNhIiwicm9zZSI6ImFub24iLCJpYXQiOjE3NjI1NDk4MjcsImV4cCI6MjA3ODEyNTgyN30.BxgH_mcXgjwuiRz8yhwpxnF-UDkLyFpl16Yo0sz-0Qk";

export const supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);