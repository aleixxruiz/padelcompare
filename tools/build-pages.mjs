/**
 * Generador de SEO: crea una ficha HTML por pala en /pala/<id>.html y el
 * sitemap.xml. Las fichas tienen el contenido en HTML (sin depender de JS),
 * con metadatos, Open Graph y datos estructurados (JSON-LD) para Google.
 *
 * Uso:  node tools/build-pages.mjs
 * (Re-ejecútalo cuando cambie datos/productos.js)
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PALA_DIR = resolve(ROOT, "pala");
const BASE = "https://aleixxruiz.github.io/padelcompare"; // cambiar al dominio en el lanzamiento

// Cargar productos
function cargar() {
  const txt = readFileSync(resolve(ROOT, "datos/productos.js"), "utf-8");
  const m = txt.match(/window\.PRODUCTOS\s*=\s*([\s\S]*);\s*$/);
  return JSON.parse(m[1]);
}
const P = cargar();

// Utilidades
const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const att = (s) => esc(s).replace(/"/g, "&quot;");
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const slug = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
const eur = (n) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
const HOY = new Date().toISOString().slice(0, 10);

function similares(p) {
  var mismaForma = P.filter((x) => x.id !== p.id && x.forma === p.forma);
  var top = mismaForma.filter((x) => x.nivel === p.nivel && x.estilo === p.estilo);
  var lista = top.concat(mismaForma.filter((x) => top.indexOf(x) === -1));
  return lista.slice(0, 4);
}

function badge(v) { return '<span class="badge b-' + slug(v) + '">' + cap(v) + "</span>"; }
function fila(et, v) { return v ? "<tr><th>" + et + "</th><td>" + esc(v) + "</td></tr>" : ""; }

function ficha(p) {
  const img = p.imagen ? "../" + p.imagen : "";
  const imgAbs = p.imagen ? BASE + "/" + p.imagen : "";
  const url = BASE + "/pala/" + p.id + ".html";
  const desc = (p.descripcion || p.nombre).slice(0, 160);
  const titulo = p.nombre + " — opiniones, características y precio | Padel Ideal";

  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: p.nombre,
        image: imgAbs || undefined,
        description: p.descripcion || p.nombre,
        brand: { "@type": "Brand", name: p.marca },
        category: "Pala de pádel",
        offers: { "@type": "Offer", price: p.precio, priceCurrency: "EUR", availability: "https://schema.org/InStock" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: BASE + "/" },
          { "@type": "ListItem", position: 2, name: "Palas de pádel", item: BASE + "/palas.html" },
          { "@type": "ListItem", position: 3, name: p.nombre, item: url },
        ],
      },
    ],
  };

  const sim = similares(p).map((s) =>
    '<a class="sim-card" href="' + s.id + '.html">' +
      (s.imagen ? '<img src="../' + att(s.imagen) + '" alt="' + att(s.nombre) + '" loading="lazy">' : "") +
      "<span>" + esc(s.nombre) + "</span>" +
      '<b>' + eur(s.precio) + "</b>" +
    "</a>"
  ).join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(titulo)}</title>
  <meta name="description" content="${att(desc)}">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="product">
  <meta property="og:title" content="${att(p.nombre)} | Padel Ideal">
  <meta property="og:description" content="${att(desc)}">
  <meta property="og:url" content="${url}">
  ${imgAbs ? '<meta property="og:image" content="' + att(imgAbs) + '">' : ""}
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎾</text></svg>">
  <link rel="stylesheet" href="../assets/style.css">
  <script type="application/ld+json">${JSON.stringify(jsonld)}</script>
</head>
<body>
  <header class="site-header">
    <div class="container header-inner">
      <a href="../index.html" class="brand"><span class="brand-logo">P</span><span class="brand-name">Padel <span>Ideal</span></span></a>
      <nav class="nav"><a href="../index.html">Comparador</a><a href="../recomendadas.html">Recomendadas</a><a href="../cuenta.html">Mi cuenta</a></nav>
    </div>
  </header>

  <main class="container ficha">
    <nav class="breadcrumb"><a href="../index.html">Inicio</a> › <a href="../palas.html">Palas de pádel</a> › <span>${esc(p.nombre)}</span></nav>

    <div class="ficha-top">
      <div class="ficha-img">
        ${img ? '<img src="' + att(img) + '" alt="' + att(p.nombre) + '">' : '<span class="inicial">' + esc(p.marca.charAt(0)) + "</span>"}
      </div>
      <div class="ficha-info">
        <p class="card-marca">${esc(p.marca)}</p>
        <h1>${esc(p.nombre)}</h1>
        <div class="badges">${badge(p.nivel)}${badge(p.estilo)}${badge(p.forma)}${badge("balance " + p.balance)}</div>
        ${p.valoracion != null ? '<p class="ficha-rating">★ ' + p.valoracion.toFixed(1) + " / 5</p>" : ""}
        <p class="ficha-precio">${eur(p.precio)}${p.precioOriginal ? ' <span class="original">' + eur(p.precioOriginal) + "</span>" : ""}</p>
        <p class="ficha-desc">${esc(p.descripcion || "")}</p>
        <a class="btn-primary" href="../index.html">Comparar con otras palas →</a>
      </div>
    </div>

    <h2>Características</h2>
    <table class="ficha-specs">
      ${fila("Nivel", cap(p.nivel))}
      ${fila("Estilo de juego", cap(p.estilo))}
      ${fila("Forma", cap(p.forma))}
      ${fila("Balance", cap(p.balance))}
      ${fila("Tacto", p.tacto)}
      ${fila("Peso", p.peso)}
      ${fila("Material del marco", p.material && p.material.marco)}
      ${fila("Material del plano", p.material && p.material.plano)}
      ${fila("Material del núcleo (goma)", p.material && p.material.goma)}
      ${fila("Temporada", p.temporada || p.anio)}
    </table>

    ${sim ? '<h2>Palas similares</h2><div class="sim-grid">' + sim + "</div>" : ""}
  </main>

  <footer class="site-footer">
    <div class="container"><p>Padel Ideal · <a href="../privacidad.html">Privacidad</a> · <a href="../aviso-legal.html">Aviso legal</a> · <a href="../cookies.html">Cookies</a></p></div>
  </footer>
  <script src="../assets/nav.js"></script>
</body>
</html>
`;
}

// --- Generar ---
if (existsSync(PALA_DIR)) rmSync(PALA_DIR, { recursive: true, force: true });
mkdirSync(PALA_DIR, { recursive: true });
let n = 0;
const vistos = new Set();
for (const p of P) { if (vistos.has(p.id)) continue; vistos.add(p.id); writeFileSync(resolve(PALA_DIR, p.id + ".html"), ficha(p)); n++; }

// --- Directorio "Todas las palas" (hub de enlaces para SEO) ---
const porMarca = {};
P.forEach((p) => { (porMarca[p.marca] = porMarca[p.marca] || []).push(p); });
const dirHtml = Object.keys(porMarca).sort((a, b) => a.localeCompare(b, "es")).map((m) => {
  const items = porMarca[m].slice().sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
    .map((p) => '<li><a href="pala/' + p.id + '.html">' + esc(p.nombre) + "</a></li>").join("");
  return '<h2 id="' + slug(m) + '">' + esc(m) + "</h2><ul class=\"dir-list\">" + items + "</ul>";
}).join("\n");
const palasPage = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Todas las palas de pádel (${vistos.size}) | Padel Ideal</title>
  <meta name="description" content="Listado completo de palas de pádel por marca. Consulta características, valoración y precio de cada pala.">
  <link rel="canonical" href="${BASE}/palas.html">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎾</text></svg>">
  <link rel="stylesheet" href="assets/style.css">
</head>
<body>
  <header class="site-header">
    <div class="container header-inner">
      <a href="index.html" class="brand"><span class="brand-logo">P</span><span class="brand-name">Padel <span>Ideal</span></span></a>
      <nav class="nav"><a href="index.html">Comparador</a><a href="palas.html" class="active">Todas las palas</a><a href="recomendadas.html">Recomendadas</a><a href="cuenta.html">Mi cuenta</a></nav>
    </div>
  </header>
  <main class="container legal">
    <h1>Todas las palas de pádel</h1>
    <p class="legal-fecha">${vistos.size} palas · ordenadas por marca</p>
    ${dirHtml}
  </main>
  <footer class="site-footer">
    <div class="container"><p>Padel Ideal · <a href="privacidad.html">Privacidad</a> · <a href="aviso-legal.html">Aviso legal</a> · <a href="cookies.html">Cookies</a></p></div>
  </footer>
  <script src="assets/nav.js"></script>
</body>
</html>
`;
writeFileSync(resolve(ROOT, "palas.html"), palasPage);

// --- sitemap.xml ---
const urls = [
  { loc: BASE + "/", pr: "1.0" },
  { loc: BASE + "/palas.html", pr: "0.6" },
  { loc: BASE + "/privacidad.html", pr: "0.3" },
  { loc: BASE + "/aviso-legal.html", pr: "0.3" },
  { loc: BASE + "/cookies.html", pr: "0.3" },
].concat([...vistos].map((id) => ({ loc: BASE + "/pala/" + id + ".html", pr: "0.7" })));

const sitemap =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map((u) => "  <url><loc>" + u.loc + "</loc><lastmod>" + HOY + "</lastmod><priority>" + u.pr + "</priority></url>").join("\n") +
  "\n</urlset>\n";
writeFileSync(resolve(ROOT, "sitemap.xml"), sitemap);

console.log("✓ " + n + " fichas en /pala/ y sitemap.xml con " + urls.length + " URLs");
