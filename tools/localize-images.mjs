/**
 * Descarga las imágenes de las palas a assets/palas/ y reescribe datos/productos.js
 * para que apunten a rutas locales. Además elimina los campos `url` y `tienda`
 * (para que no quede ningún rastro de la fuente original).
 *
 * Uso:  node tools/localize-images.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, extname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DATA = resolve(ROOT, "datos/productos.js");
const IMG_DIR = resolve(ROOT, "assets/palas");
const UA = "Mozilla/5.0";

function cargar() {
  const txt = readFileSync(DATA, "utf-8");
  const m = txt.match(/window\.PRODUCTOS\s*=\s*([\s\S]*);\s*$/);
  return JSON.parse(m[1]);
}

async function pool(items, n, fn) {
  let idx = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (idx < items.length) { const i = idx++; try { await fn(items[i], i); } catch {} }
  }));
}

async function main() {
  if (!existsSync(IMG_DIR)) mkdirSync(IMG_DIR, { recursive: true });
  const productos = cargar();
  console.log(`Descargando imágenes de ${productos.length} palas…`);

  let ok = 0, fail = 0, n = 0;
  await pool(productos, 8, async (p) => {
    if (p.imagen && /^https?:\/\//.test(p.imagen)) {
      let ext = (extname(new URL(p.imagen).pathname) || ".jpg").toLowerCase();
      if (!/\.(jpg|jpeg|png|webp|gif)$/.test(ext)) ext = ".jpg";
      const rel = `assets/palas/${p.id}${ext}`;
      const abs = resolve(ROOT, rel);
      try {
        if (!existsSync(abs)) {
          const r = await fetch(p.imagen, { headers: { "User-Agent": UA } });
          if (!r.ok) throw new Error("HTTP " + r.status);
          const buf = Buffer.from(await r.arrayBuffer());
          if (buf.length < 200) throw new Error("imagen vacía");
          writeFileSync(abs, buf);
        }
        p.imagen = rel; ok++;
      } catch { delete p.imagen; fail++; }
    } else {
      delete p.imagen;
    }
    // Eliminar cualquier rastro de la fuente
    delete p.url;
    delete p.tienda;
    if (++n % 100 === 0) console.log(`  ${n}/${productos.length}`);
  });

  const out = "/* Catálogo de palas. Imágenes locales en assets/palas/. */\n" +
    "window.PRODUCTOS = " + JSON.stringify(productos, null, 2) + ";\n";
  writeFileSync(DATA, out);
  console.log(`✓ Imágenes: ${ok} ok, ${fail} fallidas. datos/productos.js reescrito (sin url/tienda).`);
}

main().catch((e) => { console.error(e); process.exit(1); });
