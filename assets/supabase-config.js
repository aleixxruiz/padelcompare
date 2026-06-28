/* ============================================================
   Configuración de Supabase
   Datos del proyecto: Supabase → Project Settings → API
     - Project URL (base, sin /rest/v1/)
     - anon public key  (es pública; está protegida por las políticas RLS)
   ============================================================ */
window.SUPABASE_URL = "https://eeurhjegbmogxzkhydzf.supabase.co";
window.SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVldXJoamVnYm1vZ3h6a2h5ZHpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2MjUyMTYsImV4cCI6MjA5ODIwMTIxNn0.2zgZsR3DqlAFizlXZbVnWsbsoYuQw1-1rs-YhRecpcs";

// Crea el cliente global (requiere haber cargado el SDK de supabase antes).
window.sb = (window.supabase && window.SUPABASE_URL.indexOf("TU-PROYECTO") === -1)
  ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY)
  : null;

window.SUPABASE_LISTO = !!window.sb;
