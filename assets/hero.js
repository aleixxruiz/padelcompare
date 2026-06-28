/* ============================================================
   Hero premium: tarjeta "VS" + franja de stats. Iconos SVG de línea
   (como el mockup, sin emojis). Las imágenes de las palas del VS se toman
   de assets/vs-a.png y assets/vs-b.png (PNG con fondo transparente);
   si no existen, usa una imagen del catálogo como respaldo.
   ============================================================ */
(function () {
  "use strict";
  var P = (window.PRODUCTOS || []).filter(function (p) { return p.imagen; });
  if (!P.length) return;

  // --- Iconos SVG (stroke = currentColor) ---
  var I = {
    rayo: '<path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"/>',
    control: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="1" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="1" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="23" y2="12"/>',
    manejo: '<path d="M21 12a9 9 0 1 1-2.6-6.3"/><polyline points="21 4 21 9 16 9"/>',
    bola: '<circle cx="12" cy="12" r="9"/><path d="M5 5c4 3 4 11 0 14"/><path d="M19 5c-4 3-4 11 0 14"/>',
    confort: '<path d="M4 20c0-9 7-15 16-15 0 9-7 15-16 15z"/><path d="M4 20c3-5 7-8 11-9"/>',
    box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4"/><line x1="12" y1="11" x2="12" y2="21"/>',
    tag: '<path d="M3 12l9-9 9 9-9 9z"/><circle cx="8" cy="8" r="1.4"/>',
    sliders: '<line x1="4" y1="8" x2="20" y2="8"/><line x1="4" y1="16" x2="20" y2="16"/><circle cx="9" cy="8" r="2.3"/><circle cx="15" cy="16" r="2.3"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.5 7.2L3 21l1.8-6.5A8 8 0 1 1 21 12z"/>',
    precio: '<circle cx="12" cy="12" r="9"/><path d="M15 9.5a3.5 3.5 0 1 0 0 5"/><line x1="7.5" y1="11" x2="13" y2="11"/><line x1="7.5" y1="13.2" x2="12" y2="13.2"/>',
    lobo: '<path d="M12 21C9 18.5 6.2 15 5.7 8.6L4 3.8 8.7 7Q12 9 15.3 7L20 3.8 18.3 8.6C17.8 15 15 18.5 12 21Z"/><circle cx="9.3" cy="11.2" r="1" fill="currentColor" stroke="none"/><circle cx="14.7" cy="11.2" r="1" fill="currentColor" stroke="none"/><path d="M10.7 15h2.6L12 16.9Z" fill="currentColor" stroke="none"/>',
    alien: '<path d="M12 2.5C17 2.5 20 6 20 10 20 13.5 17.5 17 14 19.6 13 20.3 12.4 21 12 21.6 11.6 21 11 20.3 10 19.6 6.5 17 4 13.5 4 10 4 6 7 2.5 12 2.5Z"/><path d="M10.7 9C8.7 8.3 6 9.3 5.9 11.5 5.8 13.2 8.4 14 10.4 12.9 11.7 12.2 12 9.8 10.7 9Z" fill="currentColor" stroke="none"/><path d="M13.3 9C15.3 8.3 18 9.3 18.1 11.5 18.2 13.2 15.6 14 13.6 12.9 12.3 12.2 12 9.8 13.3 9Z" fill="currentColor" stroke="none"/>',
  };
  function svg(p, cls) { return '<svg class="' + (cls || "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + p + "</svg>"; }

  // --- Puntuaciones por dimensión (0-10) ---
  function clamp(n) { return Math.max(1, Math.min(9.7, n)); }
  function r1(n) { return Math.round(n * 10) / 10; }
  // Pequeña variación determinista por pala+dimensión (-0.4..+0.4) para que
  // dos palas parecidas no salgan con notas idénticas.
  function seed(p) { var s = p.id || "", h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
  function jit(p, k) { return (((seed(p) >> (k * 3)) % 9) - 4) / 10; }
  function metricas(p) {
    var diam = p.forma === "diamante", red = p.forma === "redonda";
    var alto = p.balance === "alto", bajo = p.balance === "bajo";
    var base = (p.valoracion || 4) * 0.18;
    return {
      Potencia: r1(clamp((p.estilo === "potencia" ? 8.2 : p.estilo === "control" ? 6.4 : 7.4) + (alto ? 0.7 : 0) + (diam ? 0.5 : 0) - (bajo ? 0.5 : 0) + base + jit(p, 0))),
      Control: r1(clamp((p.estilo === "control" ? 8.4 : p.estilo === "potencia" ? 6.8 : 7.5) + (bajo ? 0.7 : 0) + (red ? 0.5 : 0) - (alto ? 0.5 : 0) + base + jit(p, 1))),
      Manejabilidad: r1(clamp((red ? 8.4 : diam ? 7 : 7.7) + (bajo ? 0.6 : 0) - (alto ? 0.4 : 0) + jit(p, 2))),
      "Salida de bola": r1(clamp((p.estilo === "control" || red ? 8.2 : 7.4) + (bajo ? 0.5 : 0) + jit(p, 3))),
      Confort: r1(clamp((red || bajo ? 8.3 : diam ? 7.2 : 7.6) + base + jit(p, 4))),
    };
  }
  var DIMS = [["Potencia", "rayo"], ["Control", "control"], ["Manejabilidad", "manejo"], ["Salida de bola", "bola"], ["Confort", "confort"]];

  function mejor(filtro) { return P.filter(filtro).sort(function (a, b) { return (b.valoracion || 0) - (a.valoracion || 0); })[0]; }
  function byId(id) { return P.filter(function (p) { return p.id === id; })[0]; }
  // Duelo destacado: Babolat de Juan Lebrón vs Adidas Metalbone de Ale Galán.
  var A = byId("babolat-viper-3-0-2026-juan-lebron") || mejor(function (p) { return p.estilo === "potencia"; }) || P[0];
  var B = byId("adidas-metalbone-hrd-2026-ale-galan") || mejor(function (p) { return p.estilo === "control" && p.id !== (A && A.id); }) || P[1] || P[0];
  var NAME_A = "Juan Lebrón", NAME_B = "Ale Galán";

  function imgPala(slot, fallback) {
    return '<img src="assets/' + slot + '.png" alt="pala" loading="lazy" ' +
      "onerror=\"this.onerror=null;this.src='" + fallback + "';this.classList.add('framed')\">";
  }

  function render() {
    var cont = document.getElementById("hero-vs");
    if (!cont) return;
    var mA = metricas(A), mB = metricas(B);
    var filas = DIMS.map(function (d) {
      var a = mA[d[0]], b = mB[d[0]];
      return '<div class="vs-row">' +
        '<span class="vs-sc">' + a.toFixed(1) + "</span>" +
        '<div class="vs-bar a"><i style="width:' + (a * 10) + '%"></i></div>' +
        '<span class="vs-lab">' + svg(I[d[1]], "vs-ic") + '<span class="vs-txt">' + d[0] + "</span></span>" +
        '<div class="vs-bar b"><i style="width:' + (b * 10) + '%"></i></div>' +
        '<span class="vs-sc">' + b.toFixed(1) + "</span>" +
      "</div>";
    }).join("");

    cont.innerHTML =
      '<div class="vs-top">' +
        '<div class="vs-pala">' + imgPala("vs-a", A.imagen) + '<span class="vs-name"><span class="vs-mascot">🐺</span>' + NAME_A + "</span></div>" +
        '<div class="vs-badge">VS</div>' +
        '<div class="vs-pala">' + imgPala("vs-b", B.imagen) + '<span class="vs-name"><span class="vs-mascot">👽</span>' + NAME_B + "</span></div>" +
      "</div>" +
      '<div class="vs-stats">' + filas + "</div>";

    var verComp = document.querySelector(".hero-cta .btn-outline");
    if (verComp) verComp.setAttribute("href", "index.html?comparar=" + A.id + "&comparar2=" + B.id + "#comparador");
  }

  function renderStrip() {
    var strip = document.getElementById("hero-strip");
    if (!strip) return;
    var marcas = {}; P.forEach(function (p) { marcas[p.marca] = 1; });
    var nMarcas = Object.keys(marcas).length;
    var items = [
      ["box", "+" + (Math.floor(P.length / 50) * 50), "productos"],
      ["tag", "+" + (Math.floor(nMarcas / 5) * 5), "marcas"],
      ["sliders", "Comparador", "inteligente"],
      ["chat", "Opiniones", "verificadas"],
      ["precio", "Precios", "actualizados"],
    ];
    strip.innerHTML = items.map(function (it) {
      return '<div class="hs"><span class="hs-ic">' + svg(I[it[0]]) + "</span><div class=\"hs-tx\"><b>" + it[1] + "</b><span>" + it[2] + "</span></div></div>";
    }).join("");
  }

  render();
  renderStrip();
})();
