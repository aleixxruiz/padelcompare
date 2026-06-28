# Configurar Supabase (registro de usuarios + perfil)

La web ya trae listo el login, el formulario de perfil y la página de
recomendaciones. Solo falta conectar tu propio proyecto de Supabase (gratis).

## 1. Crear el proyecto
1. Entra en https://supabase.com y crea una cuenta (gratis).
2. **New project** → ponle nombre (p. ej. `padel-match`), elige una contraseña
   para la base de datos y una región cercana (Europe).
3. Espera ~2 min a que se cree.

## 2. Crear las tablas
1. En el panel de tu proyecto: **SQL Editor** → **New query**.
2. Abre el archivo `supabase/schema.sql` de este repo, copia TODO su contenido,
   pégalo y pulsa **Run**. Debe decir "Success".

## 3. Configurar el acceso por correo
1. **Authentication → Providers → Email**: asegúrate de que **Email** está activado.
   (Por defecto usa "Magic Link", que es justo lo que usamos.)
2. **Authentication → URL Configuration**:
   - **Site URL**: `https://aleixxruiz.github.io/padelcompare/`
   - En **Redirect URLs** añade también:
     `https://aleixxruiz.github.io/padelcompare/cuenta.html`
   (Para pruebas en local, añade además `http://localhost:8000/cuenta.html`.)

## 4. Copiar tus claves
1. **Project Settings → API**.
2. Copia **Project URL** y **anon public**.
3. Abre `assets/supabase-config.js` y pega ambos valores:
   ```js
   window.SUPABASE_URL = "https://xxxxx.supabase.co";
   window.SUPABASE_ANON_KEY = "eyJhbGciOi...";  // anon public
   ```
   > La clave *anon* es pública: puede ir en el navegador. Los datos están
   > protegidos por las políticas RLS del paso 2. **Nunca** pongas la clave
   > *service_role* aquí.

## 5. Subir y probar
```bash
git add assets/supabase-config.js && git commit -m "Configurar Supabase" && git push
```
1. Entra en `https://aleixxruiz.github.io/padelcompare/cuenta.html`.
2. Pon tu correo → "Enviar enlace de acceso" → revisa tu email → pulsa el enlace.
3. Rellena el perfil y guarda.
4. Ve a **Recomendadas** y verás tus palas según tu perfil.

## Notas
- Antes de hacerla pública de verdad, **edita `privacidad.html`** con tus datos
  reales (responsable y email de contacto).
- Plan gratuito de Supabase: sobra para empezar (miles de usuarios).
- Lo siguiente del roadmap (reseñas, wishlist, alertas por email) se construye
  sobre esta misma base de Supabase.
