/* ============================================================
   Configuración de Supabase
   Pega aquí los datos de TU proyecto: Supabase → Project Settings → API
     - Project URL
     - anon public key  (es pública; está protegida por las políticas RLS)
   ============================================================ */
window.SUPABASE_URL = "https://TU-PROYECTO.supabase.co";
window.SUPABASE_ANON_KEY = "TU_ANON_PUBLIC_KEY";

// Crea el cliente global (requiere haber cargado el SDK de supabase antes).
window.sb = (window.supabase && window.SUPABASE_URL.indexOf("TU-PROYECTO") === -1)
  ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY)
  : null;

window.SUPABASE_LISTO = !!window.sb;
