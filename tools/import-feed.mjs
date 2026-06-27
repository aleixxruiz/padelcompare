/**
 * Importador de feed de afiliados → datos/productos.js
 *
 * Convierte un feed de productos (CSV o XML tipo Google Shopping) en el archivo
 * que consume la web. Deduce nivel/estilo/forma/balance del título y la
 * descripción, y filtra para quedarse solo con palas de pádel.
 *
 * Uso:
 *   node tools/import-feed.mjs --in feed.csv --tienda "Padel Nuestro"
 *   node tools/import-feed.mjs --in https://.../feed.xml --format xml --tienda "Decathlon"
 *   node tools/import-feed.mjs --in feed.csv --limit 500 --no-filter   (sin filtrar a palas)
 *
 * Tras revisar el resultado:  git add datos/productos.js && git commit && git push
 *
 * ⚙️  AJUSTA EL MAPEADO: cada feed nombra sus columnas distinto. Edita FIELD_MAP
 *     con los nombres reales de tu feed (cabeceras CSV o etiquetas XML).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, extname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../datos/productos.js");

// --- Mapeo de campos del feed → nuestros campos -----------------------------
// Pon a la izquierda nuestro campo y a la derecha los posibles nombres en el
// feed (se usa el primero que exista). Sirve para CSV (cabeceras) y XML (tags).
const FIELD_MAP = {
  nombre: ["title", "g:title", "name", "product_name", "titulo"],
  marca: ["brand", "g:brand", "marca", "manufacturer"],
  precio: ["sale_price", "g:sale_price", "price", "g:price", "precio"],
  precioOriginal: ["price", "g:price", "list_price", "pvp", "precio_original"],
  descripcion: ["description", "g:description", "descripcion", "desc"],
  url: ["link", "g:link", "url", "product_url", "aw_deep_link", "enlace"],
  imagen: ["image_link", "g:image_link", "image", "imagen", "image_url"],
  categoria: ["product_type", "g:product_type", "category", "g:google_product_category", "categoria"],
  id: ["id", "g:id", "sku", "mpn", "g:mpn"],
};

// ---------------------------------------------------------------------------
function parseArgs() {
  const a = process.argv.slice(2);
  const get = (k) => { const f = a.find((x) => x.startsWith(k + "=")); return f ? f.split("=").slice(1).join("=") : undefined; };
  let inFile, format, tienda, limit;
  for (let i = 0; i < a.length; i++) {
    if (a[i] === "--in") inFile = a[++i];
    else if (a[i] === "--format") format = a[++i];
    else if (a[i] === "--tienda") tienda = a[++i];
    else if (a[i] === "--limit") limit = Number(a[++i]);
    else if (a[i].startsWith("--in=")) inFile = a[i].slice(5);
    else if (a[i].startsWith("--tienda=")) tienda = a[i].slice(9);
  }
  return {
    inFile, format, tienda: tienda || "Tienda",
    limit: limit || Infinity,
    noFilter: a.includes("--no-filter"),
  };
}

async function leerFuente(inFile, format) {
  let texto;
  if (/^https?:\/\//.test(inFile)) {
    const res = await fetch(inFile, { headers: { "User-Agent": "padel-import/1.0" } });
    if (!res.ok) throw new Error("HTTP " + res.status + " al descargar el feed");
    texto = await res.text();
  } else {
    texto = readFileSync(resolve(process.cwd(), inFile), "utf-8");
  }
  const fmt = format || (extname(inFile).toLowerCase() === ".xml" ? "xml" : "csv");
  return { texto, fmt };
}

// --- CSV (detecta delimitador, respeta comillas) ---------------------------
function parseCSV(texto) {
  const t = texto.replace(/^﻿/, "");
  const primeraLinea = t.slice(0, t.indexOf("\n"));
  const delim = [";", "\t", ","].sort(
    (x, y) => (primeraLinea.split(y).length - primeraLinea.split(x).length)
  )[0];
  const filas = [];
  let campo = "", fila = [], dentro = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (dentro) {
      if (c === '"') { if (t[i + 1] === '"') { campo += '"'; i++; } else dentro = false; }
      else campo += c;
    } else if (c === '"') dentro = true;
    else if (c === delim) { fila.push(campo); campo = ""; }
    else if (c === "\n") { fila.push(campo); filas.push(fila); fila = []; campo = ""; }
    else if (c === "\r") { /* ignora */ }
    else campo += c;
  }
  if (campo.length || fila.length) { fila.push(campo); filas.push(fila); }
  const cab = filas.shift().map((h) => h.trim());
  return filas.filter((f) => f.length > 1).map((f) => {
    const o = {}; cab.forEach((h, i) => (o[h] = (f[i] || "").trim())); return o;
  });
}

// --- XML tipo Google Shopping (<item>…</item>) -----------------------------
function parseXML(texto) {
  const items = texto.match(/<item\b[\s\S]*?<\/item>/gi) || [];
  const limpia = (s) => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
  return items.map((it) => {
    const o = {};
    const re = /<([\w:-]+)[^>]*>([\s\S]*?)<\/\1>/g; let m;
    while ((m = re.exec(it))) o[m[1].toLowerCase()] = limpia(m[2]);
    return o;
  });
}

// --- Inferencia de atributos ------------------------------------------------
function val(obj, campo) {
  for (const k of FIELD_MAP[campo]) {
    const hit = Object.keys(obj).find((x) => x.toLowerCase() === k.toLowerCase());
    if (hit && obj[hit] !== "") return obj[hit];
  }
  return "";
}
function slug(s) { return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }
function precioNum(s) { if (!s) return null; const n = parseFloat(String(s).replace(/[^\d,.]/g, "").replace(/\.(?=\d{3})/g, "").replace(",", ".")); return Number.isFinite(n) ? n : null; }
function nivel(t) { t = t.toLowerCase(); if (/iniciaci|principiante/.test(t)) return "iniciación"; if (/avanzad|competici|profesional|\bpro\b|experto/.test(t)) return "avanzado"; return "intermedio"; }
function estilo(t) { t = t.toLowerCase(); const p = /potencia|pegada|remate|ataque|power|ofensiv/.test(t), c = /control|precisi|defensa|manej|toque/.test(t); if (p && !c) return "potencia"; if (c && !p) return "control"; return "polivalente"; }
function forma(t) { t = t.toLowerCase(); if (/diamante/.test(t)) return "diamante"; if (/l[áa]grima|gota|teardrop/.test(t)) return "lágrima"; return "redonda"; }
function balance(t, f) { t = t.toLowerCase(); if (/balance alto/.test(t)) return "alto"; if (/balance bajo/.test(t)) return "bajo"; if (/balance medio/.test(t)) return "medio"; return f === "diamante" ? "alto" : f === "redonda" ? "bajo" : "medio"; }

function esPala(nombre, categoria) {
  const t = (nombre + " " + categoria).toLowerCase();
  if (/(paletero|mochila|zapatilla|overgrip|grip|protector|bolsa|camiseta|pantal|mu[ñn]equera|gorra|pelota|bola)/.test(t)) return false;
  return /\bpala/.test(t) || /palas? de p[áa]del/.test(t);
}

async function main() {
  const { inFile, format, tienda, limit, noFilter } = parseArgs();
  if (!inFile) { console.error("Falta --in <archivo|url>"); process.exit(1); }

  const { texto, fmt } = await leerFuente(inFile, format);
  const filas = fmt === "xml" ? parseXML(texto) : parseCSV(texto);
  console.log(`Leídas ${filas.length} filas del feed (${fmt}).`);

  const vistos = new Set();
  const productos = [];
  for (const row of filas) {
    const nombre = val(row, "nombre");
    const precio = precioNum(val(row, "precio"));
    const url = val(row, "url");
    if (!nombre || precio == null || !url) continue;

    const categoria = val(row, "categoria");
    if (!noFilter && !esPala(nombre, categoria)) continue;

    const marca = val(row, "marca") || nombre.split(/\s+/)[0];
    const descripcion = val(row, "descripcion") || nombre;
    const texto2 = nombre + " " + descripcion;
    const f = forma(texto2);
    const id = slug(val(row, "id") ? marca + "-" + val(row, "id") : marca + "-" + nombre);
    if (vistos.has(id)) continue; vistos.add(id);

    const original = precioNum(val(row, "precioOriginal"));
    productos.push({
      id, nombre, marca, precio,
      precioOriginal: original && original > precio ? original : undefined,
      nivel: nivel(texto2), estilo: estilo(texto2), forma: f, balance: balance(texto2, f),
      descripcion: descripcion.slice(0, 280),
      imagen: val(row, "imagen") || undefined,
      url, tienda,
    });
    if (productos.length >= limit) break;
  }

  console.log(`→ ${productos.length} palas tras filtrar/deduplicar.`);
  if (productos.length === 0) {
    console.error("No se obtuvo ninguna pala. Revisa FIELD_MAP y el filtro esPala().");
    process.exit(1);
  }

  const out = "/* Generado por tools/import-feed.mjs. No editar a mano. */\n" +
    "window.PRODUCTOS = " + JSON.stringify(productos, null, 2) + ";\n";
  writeFileSync(OUT, out);
  console.log(`✓ Escrito ${productos.length} productos en datos/productos.js`);
}

main().catch((e) => { console.error(e); process.exit(1); });
