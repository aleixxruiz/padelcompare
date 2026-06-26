/**
 * Cloudflare Worker — Asistente IA de PadelCompare
 *
 * Recibe POST { message, history, productos } desde assets/widget.js, llama a la
 * API de Claude (Messages API) con el system prompt de pádel + la base de datos
 * de productos, y devuelve { reply }.
 *
 * Despliegue (resumen — ver worker/README.md):
 *   1) npm i -g wrangler   (o usar el panel de Cloudflare)
 *   2) wrangler secret put ANTHROPIC_API_KEY   → pega tu clave de api.anthropic.com
 *   3) wrangler deploy
 *   4) copia la URL del worker en CONFIG.aiUrl de assets/widget.js
 */

// System prompt de pádel (resumen del padel_system_prompt.txt del proyecto).
const SYSTEM_PROMPT = `Eres un asistente experto en pádel especializado en recomendación y comparación de palas.
Tu función es ayudar a elegir la mejor pala según nivel, estilo de juego y presupuesto.

REGLAS IMPORTANTES:
- Recomienda SOLO productos que existan en la BASE DE DATOS proporcionada más abajo. Nunca inventes productos, marcas ni precios.
- Si falta información del usuario (nivel, presupuesto, estilo), pregúntala antes de recomendar.
- Devuelve de 1 a 3 opciones: una "Mejor recomendación" destacada y alternativas, cada una con una explicación clara y breve de por qué encaja.
- Tono claro, experto y directo, sin marketing vacío. Responde en español.
- Puedes mencionar el precio y la tienda de cada pala. No uses datos fuera de la base.`;

// Modelo de Claude. Por defecto Opus 4.8 (máxima calidad).
// Para abaratar costes en un asistente sencillo, puedes cambiarlo a
// "claude-haiku-4-5" (más barato) o "claude-sonnet-4-6" (equilibrado).
const MODEL = "claude-opus-4-8";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }
    if (request.method !== "POST") {
      return json({ error: "Usa POST" }, 405);
    }
    if (!env.ANTHROPIC_API_KEY) {
      return json({ error: "Falta ANTHROPIC_API_KEY en el worker" }, 500);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "JSON inválido" }, 400);
    }

    const message = (body.message || "").toString().slice(0, 2000);
    const history = Array.isArray(body.history) ? body.history.slice(-10) : [];
    const productos = Array.isArray(body.productos) ? body.productos : [];
    if (!message) return json({ error: "Falta 'message'" }, 400);

    // Mensajes: historial previo + mensaje actual del usuario.
    const messages = history
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && m.content)
      .map((m) => ({ role: m.role, content: String(m.content) }));
    messages.push({ role: "user", content: message });

    // System: prompt + base de datos compacta (solo campos relevantes).
    const db = productos.map((p) => ({
      nombre: p.nombre, marca: p.marca, precio: p.precio,
      nivel: p.nivel, estilo: p.estilo, forma: p.forma, balance: p.balance,
      peso: p.peso, valoracion: p.valoracion, tienda: p.tienda, url: p.url,
    }));
    const system =
      SYSTEM_PROMPT +
      "\n\nBASE DE DATOS (JSON, único catálogo permitido):\n" +
      JSON.stringify(db);

    try {
      const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1024,
          system,
          messages,
        }),
      });

      if (!apiRes.ok) {
        const errText = await apiRes.text();
        return json({ error: "Error de la API de Claude", detail: errText }, 502);
      }

      const data = await apiRes.json();
      // Concatena los bloques de texto de la respuesta.
      const reply = (data.content || [])
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();

      return json({ reply: reply || "No he podido generar una respuesta." });
    } catch (err) {
      return json({ error: "Fallo al contactar con la API", detail: String(err) }, 502);
    }
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", ...CORS },
  });
}
