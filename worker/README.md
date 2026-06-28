# Asistente IA — Cloudflare Worker (Padel Ideal)

El Worker conecta la web con la API de Claude **sin exponer tu clave** (se guarda
como *Secret* cifrado en Cloudflare). Modelo por defecto: `claude-haiku-4-5`.

## 1. Conseguir la clave de Anthropic (tiene coste por uso)
1. Entra en https://console.anthropic.com → **API Keys** → **Create Key**.
2. Cópiala (empieza por `sk-ant-...`).
3. Añade saldo/billing en **Settings → Billing** (sin saldo, la IA no responde).

## 2. Crear el Worker (panel de Cloudflare, lo más seguro)
1. Entra en https://dash.cloudflare.com → **Workers & Pages** → **Create** → **Create Worker**.
2. Ponle un nombre (p. ej. `padel-ideal-ia`) → **Deploy** (crea uno de ejemplo).
3. **Edit code**: borra todo y pega el contenido de `worker/padel-worker.js`. → **Deploy**.

## 3. Guardar la clave como SECRET (cifrada)
1. En el Worker → **Settings** → **Variables and Secrets** → **Add**.
2. Tipo **Secret** (no "Text"), nombre **`ANTHROPIC_API_KEY`**, valor = tu `sk-ant-...`.
3. **Save and deploy**.
   > Al ser *Secret*, queda cifrada y no se puede volver a leer: es lo seguro.

## 4. Copiar la URL del Worker
- Arriba del Worker verás su URL: `https://padel-ideal-ia.TU-SUBDOMINIO.workers.dev`.
- Pásamela y yo la pongo en `assets/widget.js` y activo el botón en la web.
  (O edítalo tú: `CONFIG.aiUrl = "https://...workers.dev/"`.)

## Coste y optimización
- El Worker manda el catálogo con **caché de prompt**: las consultas seguidas
  reutilizan la caché y cuestan ~10× menos.
- Con Haiku, cada consulta cuesta unos céntimos. Puedes vigilar el gasto en la
  consola de Anthropic y poner un **límite de gasto** en Billing.

## Probar
`curl` rápido (sustituye la URL):
```bash
curl -X POST https://padel-ideal-ia.TU-SUBDOMINIO.workers.dev/ \
  -H "Content-Type: application/json" \
  -d '{"message":"Soy nivel 3, busco control por menos de 150€","productos":[]}'
```
(Con `productos:[]` responderá que necesita catálogo; la web ya se lo envía.)
