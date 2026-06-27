/**
 * Scraper de padelzoom.es → datos/productos.js
 *
 * Sigue el método del tutorial https://hescaso.github.io/ScrapingPalas/:
 *   1) Recorre el listado paginado (palas/?fwp_paged=N) → nombre, precio,
 *      puntuación, descuento, imagen y enlace a la ficha.
 *   2) Entra en cada ficha → forma, balance, nivel, peso y descripción.
 *
 * Uso:
 *   node tools/scrape-padelzoom.mjs                 # todo el catálogo + fichas
 *   node tools/scrape-padelzoom.mjs --sin-detalles  # solo el listado (rápido)
 *   node tools/scrape-padelzoom.mjs --max-paginas 5 # límite para pruebas
 *
 * Tras revisar:  git add datos/productos.js && git commit && git push
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../datos/productos.js");
const BASE = "https://padelzoom.es";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";

const args = process.argv.slice(2);
const SIN_DETALLES = args.includes("--sin-detalles");
const MAX_PAGINAS = (() => { const i = args.indexOf("--max-paginas"); return i >= 0 ? Number(args[i + 1]) : 100; })();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, reintentos = 2) {
  for (let i = 0; i <= reintentos; i++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "es-ES,es;q=0.9" } });
      if (!r.ok) throw new Error("HTTP " + r.status);
      return await r.text();
    } catch (e) { if (i === reintentos) throw e; await sleep(700 * (i + 1)); }
  }
}

// --- utilidades de texto ----------------------------------------------------
const limpiar = (s) => s.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&#?\w+;/g, " ").replace(/\s+/g, " ").trim();
const num = (s) => { if (!s) return null; const n = parseFloat(String(s).replace(/[^\d,.]/g, "").replace(",", ".")); return Number.isFinite(n) ? n : null; };
const slug = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const MARCAS = ["Bullpadel","Adidas","Nox","Head","Babolat","Siux","StarVie","Star Vie","Wilson","Dunlop","Vibora","Víbora","Kuikma","Drop Shot","Black Crown","Varlion","Akkeron","Royal Padel","Enebe","Vairo","Alkemia","Kelme","Joma","Munich","Kombat","Prince","Mystica","Cartri"];
function marcaDe(nombre) {
  const t = nombre.toLowerCase();
  for (const m of MARCAS) if (t.startsWith(m.toLowerCase())) return m === "Star Vie" ? "StarVie" : (m === "Víbora" ? "Vibora" : m);
  return nombre.split(/\s+/)[0];
}
function estiloDe(t) { t = t.toLowerCase(); const p = /potencia|pegada|remate|ataque|power|ofensiv/.test(t), c = /control|precisi|defensa|manejab|toque/.test(t); if (p && !c) return "potencia"; if (c && !p) return "control"; return "polivalente"; }
function formaDe(t) { t = t.toLowerCase(); if (/diamante/.test(t)) return "diamante"; if (/l[áa]grima|gota|h[íi]brid|teardrop/.test(t)) return "lágrima"; if (/redond/.test(t)) return "redonda"; return null; }
function balanceDe(t) { t = t.toLowerCase(); if (/balance\s+alto|balance\s+medio[- ]?alto/.test(t)) return "alto"; if (/balance\s+bajo/.test(t)) return "bajo"; if (/balance\s+medio/.test(t)) return "medio"; return null; }
function nivelDe(texto, tacto, forma) {
  const t = (texto || "").toLowerCase();
  let ini = 0, med = 0, av = 0;
  if (/iniciaci[óo]n|principiante|que empiez|se inician|primeras palas|primeros partidos|inician en el|aprender/.test(t)) ini += 2;
  if (/nivel medio|intermedi|club|progresar|polivalente|en evoluci/.test(t)) med += 2;
  if (/avanzad|competici|profesional|experto|alto nivel|buena t[ée]cnica|exigente|ofensiv|agresiv/.test(t)) av += 2;
  const tc = (tacto || "").toLowerCase();
  if (/duro/.test(tc)) av += 1; else if (/blando|suave/.test(tc)) ini += 1;
  if (forma === "diamante") av += 1; else if (forma === "redonda") ini += 1;
  if (av === 0 && med === 0 && ini === 0) return null;
  if (av >= med && av >= ini) return "avanzado";
  if (ini >= med && ini > av) return "iniciación";
  return "intermedio";
}

// --- 1) listado -------------------------------------------------------------
function parseListado(html) {
  const out = [];
  const re = /<a\s+href="(https:\/\/padelzoom\.es\/[^"]+)"[^>]*>([\s\S]*?text-title-price[\s\S]*?)<\/a>/g;
  let m;
  while ((m = re.exec(html))) {
    const url = m[1], inner = m[2];
    if (/\/palas\/?(\?|$)/.test(url) || url.includes("#")) continue;
    const nombre = limpiar((inner.match(/text-title-price[\s\S]*?<p>([\s\S]*?)<\/p>/) || [])[1] || "");
    if (!nombre) continue;
    const punt = num((inner.match(/color-red">([\d.,]+)</) || [])[1]);
    const precio = num((inner.match(/color-blue[^"]*">([\d.,]+)</) || [])[1]);
    const desc = num((inner.match(/descuento-pala-col[^>]*><span>\s*-?(\d+)\s*%/) || [])[1]);
    let img = (inner.match(/<img[^>]*src="([^"]+)"/) || [])[1] || "";
    if (img && img.startsWith("/")) img = BASE + img;
    if (precio == null) continue;
    out.push({ nombre, url, puntuacion: punt, precio, descuentoPct: desc, imagen: img || undefined });
  }
  return out;
}

// --- 2) ficha de detalle ----------------------------------------------------
function parseDetalle(html) {
  const meta = (html.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i) || [])[1] || "";
  const visible = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
  // Tabla de especificaciones: <div class="description-pala"> <p><b>Etiqueta : </b>valor</p> …
  const bloque = (visible.match(/class="description-pala"[\s\S]*?<\/div>/i) || [])[0] || "";
  const specs = {};
  const re = /<p>\s*<b>\s*([^:<]+?)\s*:\s*<\/b>\s*([^<]*)<\/p>/gi; let m;
  while ((m = re.exec(bloque))) specs[limpiar(m[1]).toLowerCase()] = limpiar(m[2]);
  // Recomendación de jugador (buena pista del nivel)
  const rec = limpiar((visible.match(/¿Para qu[ée] jugador[^<]*<\/h3>\s*<p>([\s\S]*?)<\/p>/i) || [])[1] || "");
  const texto = limpiar(visible);
  return {
    descripcion: rec || limpiar(meta) || texto.slice(0, 240),
    recomendacion: rec || undefined,
    forma: formaDe(specs["forma"] || ""),
    balance: balanceDe(texto),
    tacto: specs["tacto"] || undefined,
    temporada: specs["temporada"] || undefined,
    materialMarco: specs["material marco"] || undefined,
    materialPlano: specs["material plano"] || undefined,
    materialGoma: specs["material goma"] || undefined,
    peso: specs["peso"] ? specs["peso"].replace(/gramos/i, "g").replace(/\s+/g, " ").trim() : undefined,
  };
}

// --- pool de concurrencia ---------------------------------------------------
async function pool(items, n, fn) {
  const res = new Array(items.length); let idx = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (idx < items.length) { const i = idx++; try { res[i] = await fn(items[i], i); } catch { res[i] = null; } }
  }));
  return res;
}

async function main() {
  console.log("▶ Recorriendo el listado de padelzoom.es…");
  const vistos = new Set();
  let lista = [];
  for (let p = 1; p <= MAX_PAGINAS; p++) {
    let html;
    try { html = await get(`${BASE}/palas/?fwp_paged=${p}`); }
    catch (e) { console.warn(`  página ${p}: ${e.message}`); break; }
    const items = parseListado(html).filter((x) => !vistos.has(x.url));
    if (items.length === 0) { console.log(`  página ${p}: 0 nuevas → fin`); break; }
    items.forEach((x) => vistos.add(x.url));
    lista = lista.concat(items);
    console.log(`  página ${p}: +${items.length} (total ${lista.length})`);
    await sleep(250);
  }
  console.log(`▶ ${lista.length} palas en el listado.`);

  if (!SIN_DETALLES && lista.length) {
    console.log("▶ Descargando fichas de detalle (forma/balance/nivel/peso)…");
    let hechas = 0;
    await pool(lista, 5, async (item) => {
      try {
        const det = parseDetalle(await get(item.url));
        Object.assign(item, det);
      } catch {}
      if (++hechas % 50 === 0) console.log(`  ${hechas}/${lista.length} fichas`);
    });
  }

  // Normalizar al esquema de la web
  const productos = lista.map((x) => {
    const base = `${x.nombre} ${x.descripcion || ""}`;
    const forma = x.forma || formaDe(base) || "redonda";
    const balance = x.balance || balanceDe(base) || (forma === "diamante" ? "alto" : forma === "redonda" ? "bajo" : "medio");
    // Estilo según forma+balance (criterio habitual del pádel; el texto de
    // reseña menciona "control" y "potencia" a la vez y no sirve para clasificar).
    const estilo = (forma === "diamante" && balance === "alto") ? "potencia"
      : (forma === "redonda" && balance === "bajo") ? "control"
      : "polivalente";
    const nivel = nivelDe(`${x.recomendacion || ""} ${x.nombre} ${x.descripcion || ""}`, x.tacto, forma) || "intermedio";
    const precioOriginal = x.descuentoPct ? +(x.precio / (1 - x.descuentoPct / 100)).toFixed(2) : undefined;
    const anio = x.temporada ? (parseInt(x.temporada, 10) || undefined) : undefined;
    return {
      id: slug(x.nombre),
      nombre: x.nombre,
      marca: marcaDe(x.nombre),
      precio: x.precio,
      precioOriginal: precioOriginal && precioOriginal > x.precio ? precioOriginal : undefined,
      nivel,
      estilo,
      forma,
      balance,
      tacto: x.tacto,
      peso: x.peso,
      temporada: x.temporada,
      anio,
      material: { marco: x.materialMarco, plano: x.materialPlano, goma: x.materialGoma },
      descripcion: x.descripcion || x.nombre,
      valoracion: x.puntuacion != null ? +(x.puntuacion / 2).toFixed(1) : undefined, // /10 → /5
      popularidad: x.puntuacion != null ? Math.round(x.puntuacion * 10) : undefined,
      imagen: x.imagen, // URL temporal; ejecuta tools/localize-images.mjs para descargarla a assets/palas/
    };
  });

  const out = "/* Generado por tools/scrape-padelzoom.mjs (datos de padelzoom.es). No editar a mano. */\n" +
    "window.PRODUCTOS = " + JSON.stringify(productos, null, 2) + ";\n";
  writeFileSync(OUT, out);
  console.log(`✓ Escrito ${productos.length} palas en datos/productos.js`);
}

main().catch((e) => { console.error(e); process.exit(1); });
