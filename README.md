# Padel Ideal — Comparador de palas de pádel

Web estática para comparar palas de pádel: filtra por nivel, estilo de juego,
forma, balance, marca, tienda y precio, y compara hasta 4 palas lado a lado.
Incluye una pantalla de contraseña y un asistente IA flotante.

Hecho con **HTML + CSS + JavaScript "a pelo"** (sin frameworks ni build),
pensado para publicarse en **GitHub Pages**.

## Estructura

```
index.html              Página principal (comparador)
assets/
  style.css             Estilos
  app.js                Lógica: filtros, búsqueda, orden, comparación
  gate.js               Pantalla de contraseña (hash SHA-256, disuasoria)
  widget.js             Asistente IA flotante
datos/
  productos.js          Catálogo (window.PRODUCTOS = [...])
worker/
  padel-worker.js       Cloudflare Worker para el asistente IA
  README.md             Cómo desplegar el worker
padel_system_prompt.txt Contexto del asistente
```

## Ver en local
Al ser estático, basta abrir `index.html` en el navegador. Para que se vea
exactamente como en producción (sin problemas de rutas), sirve la carpeta:

```bash
python3 -m http.server 8000
# luego abre http://localhost:8000
```
> En local (`file://`) la pantalla de contraseña se desactiva a propósito.

## Publicar en GitHub Pages
1. Sube el repo a GitHub.
2. En el repo: **Settings → Pages**.
3. En **Build and deployment → Source**, elige **Deploy from a branch**.
4. Branch: **main** y carpeta **/(root)** → **Save**.
5. En 1-2 minutos estará en `https://TU-USUARIO.github.io/NOMBRE-REPO/`.

> GitHub Pages publica contenido **público** aunque el repo sea privado (en
> planes que lo permitan). Por eso la web incluye la pantalla de contraseña.

## Pantalla de contraseña
- Contraseña por defecto: **padel2026**.
- Para cambiarla, calcula el SHA-256 de la nueva y pégalo en `HASH` (en
  `assets/gate.js`):
  ```bash
  printf '%s' 'TU_CLAVE' | shasum -a 256
  ```
- Para desactivarla, borra `<script src="assets/gate.js">` de `index.html`.
- Es una barrera **disuasoria**: en una web estática los datos siguen siendo
  accesibles. Para bloqueo real, usa Cloudflare Access o similar.

## Asistente IA
El botón flotante llama a un **Cloudflare Worker** (ver `worker/README.md`) que
usa la API de Claude con el system prompt de pádel y el catálogo. Hasta que
configures `CONFIG.aiUrl` en `assets/widget.js`, el asistente muestra
instrucciones en vez de responder.

## Actualizar el catálogo
Edita `datos/productos.js` (un array `window.PRODUCTOS`). Cada producto:
`id, nombre, marca, precio, precioOriginal?, nivel, estilo, forma, balance,
peso?, material?, descripcion, valoracion?, popularidad?, url, tienda, anio?`.
