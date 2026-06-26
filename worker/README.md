# Asistente IA — Cloudflare Worker

Este worker da vida al botón flotante de la web (`assets/widget.js`). Recibe la
pregunta del usuario + el catálogo y llama a la API de Claude con el system
prompt de pádel.

## Requisitos
- Una cuenta de Cloudflare (gratis): https://dash.cloudflare.com
- Una clave de API de Anthropic: https://console.anthropic.com → API Keys
- `wrangler` (CLI de Cloudflare): `npm i -g wrangler`

## Desplegar (CLI)
```bash
cd worker
wrangler login                       # abre el navegador para autenticarte
wrangler secret put ANTHROPIC_API_KEY  # pega tu clave sk-ant-...
wrangler deploy                      # despliega padel-worker.js
```
Al terminar te dará una URL tipo `https://padel-worker.TU-SUBDOMINIO.workers.dev/`.

## Conectar con la web
Abre `assets/widget.js` y pega esa URL en la configuración:
```js
var CONFIG = {
  aiUrl: "https://padel-worker.TU-SUBDOMINIO.workers.dev/",
  ...
};
```
Sube el cambio y el asistente quedará operativo.

## Alternativa sin CLI (panel web)
1. dash.cloudflare.com → **Workers & Pages** → **Create** → **Worker**.
2. Pega el contenido de `padel-worker.js` en el editor y **Deploy**.
3. En **Settings → Variables and Secrets**, añade `ANTHROPIC_API_KEY` (tipo *Secret*).
4. Copia la URL del worker en `assets/widget.js`.

## Modelo y coste
Por defecto usa `claude-opus-4-8` (máxima calidad). Para un asistente sencillo
puedes bajar coste cambiando `MODEL` en `padel-worker.js` a:
- `claude-haiku-4-5` — el más barato y rápido.
- `claude-sonnet-4-6` — equilibrio calidad/precio.

El worker no expone tu clave: vive como *secret* en Cloudflare, nunca en el
navegador ni en el repositorio.
