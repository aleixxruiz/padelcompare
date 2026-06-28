/**
 * Cloudflare Worker — Asistente IA de Padel Ideal
 *
 * Recibe POST { message, history, productos } desde assets/widget.js, llama a la
 * API de Claude (Messages API) con el system prompt + el catálogo, y devuelve { reply }.
 * La clave de Anthropic se guarda como SECRET en Cloudflare (env.ANTHROPIC_API_KEY),
 * nunca en el navegador ni en el repositorio.
 *
 * Despliegue: ver worker/README.md
 */

// Modelo (Haiku = barato y rápido). Puedes cambiarlo a "claude-sonnet-4-6" o
// "claude-opus-4-8" si quieres más calidad (más coste).
const MODEL = "claude-haiku-4-5";

const SYSTEM_PROMPT = `Eres el asesor experto de Padel Ideal, un comparador de productos de pádel.
Ayudas a elegir la mejor PALA según el perfil del jugador.

REGLAS:
- Recomienda SOLO palas que existan en la BASE DE DATOS proporcionada. Nunca inventes palas, marcas, precios ni características.
- Si falta información clave del usuario (nivel, presupuesto, estilo de juego), pregúntala brevemente antes de recomendar.
- Devuelve de 1 a 3 opciones: una "Mejor opción" destacada y alguna alternativa, cada una con una explicación corta y clara de por qué encaja (nivel, estilo, forma, balance, tacto, precio).
- Tono cercano y experto, sin marketing vacío. Responde en español y de forma concisa.
- Usa "€" para los precios. No menciones tiendas ni enlaces de compra.`;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (request.method !== "POST") return json({ error: "Usa POST" }, 405);
    if (!env.ANTHROPIC_API_KEY) return json({ error: "Falta ANTHROPIC_API_KEY (secret) en el Worker" }, 500);

    let body;
    try { body = await request.json(); } catch { return json({ error: "JSON inválido" }, 400); }

    const message = String(body.message || "").slice(0, 2000);
    const history = Array.isArray(body.history) ? body.history.slice(-10) : [];
    const productos = Array.isArray(body.productos) ? body.productos : [];
    if (!message) return json({ error: "Falta 'message'" }, 400);

    // Mensajes: historial previo válido + mensaje actual
    const messages = history
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && m.content)
      .map((m) => ({ role: m.role, content: String(m.content) }));
    messages.push({ role: "user", content: message });

    // Base de datos compacta (solo campos útiles para recomendar)
    const db = productos.map((p) => ({
      nombre: p.nombre, marca: p.marca, precio: p.precio,
      nivel: p.nivel, estilo: p.estilo, forma: p.forma, balance: p.balance,
      tacto: p.tacto, peso: p.peso, valoracion: p.valoracion,
    }));

    // System en bloques: el catálogo va con cache_control para abaratar
    // mucho las consultas repetidas (lecturas de caché ~10x más baratas).
    const system = [
      { type: "text", text: SYSTEM_PROMPT },
      { type: "text", text: "BASE DE DATOS (único catálogo permitido, JSON):\n" + JSON.stringify(db), cache_control: { type: "ephemeral" } },
    ];

    try {
      const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({ model: MODEL, max_tokens: 1024, system, messages }),
      });

      if (!apiRes.ok) {
        const detail = await apiRes.text();
        return json({ error: "Error de la API de Claude", detail }, 502);
      }
      const data = await apiRes.json();
      const reply = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
      return json({ reply: reply || "Lo siento, no he podido generar una respuesta." });
    } catch (err) {
      return json({ error: "Fallo al contactar con la API", detail: String(err) }, 502);
    }
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", ...CORS } });
}
