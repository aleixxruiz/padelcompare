/* ============================================================
   Hero premium de la home: tarjeta "VS" con dos palas reales y sus
   puntuaciones por dimensión (derivadas de los atributos), más la
   franja de estadísticas. Todo a partir de window.PRODUCTOS.
   ============================================================ */
(function () {
  "use strict";
  var P = (window.PRODUCTOS || []).filter(function (p) { return p.imagen; });
  if (!P.length) return;

  // --- Puntuaciones por dimensión (0-10) derivadas de los atributos ---
  function clamp(n) { return Math.max(1, Math.min(10, n)); }
  function r1(n) { return Math.round(n * 10) / 10; }
  function metricas(p) {
    var diam = p.forma === "diamante", red = p.forma === "redonda";
    var alto = p.balance === "alto", bajo = p.balance === "bajo";
    var pot = p.estilo === "potencia" ? 8.6 : p.estilo === "control" ? 6.2 : 7.4;
    var ctrl = p.estilo === "control" ? 8.6 : p.estilo === "potencia" ? 6.3 : 7.4;
    var base = (p.valoracion || 4) * 0.4; // 0-2 aprox de empuje por valoración
    return {
      Potencia: r1(clamp(pot + (alto ? 1 : 0) + (diam ? 0.6 : 0) - (bajo ? 0.6 : 0) + base * 0.3)),
      Control: r1(clamp(ctrl + (bajo ? 1 : 0) + (red ? 0.6 : 0) - (alto ? 0.6 : 0) + base * 0.3)),
      Manejabilidad: r1(clamp((red ? 8.4 : diam ? 6.6 : 7.6) + (bajo ? 0.8 : 0) - (alto ? 0.6 : 0))),
      "Salida de bola": r1(clamp((p.estilo === "control" || red ? 8.2 : 7) + (bajo ? 0.6 : 0) + base * 0.2)),
      Confort: r1(clamp((red || bajo ? 8.3 : diam ? 6.8 : 7.5) + base * 0.3)),
    };
  }
  var ICONOS = { Potencia: "⚡", Control: "🎯", Manejabilidad: "🌀", "Salida de bola": "🎾", Confort: "🍃" };

  // --- Elegir dos palas destacadas (una de potencia, otra de control) ---
  function mejor(filtro) {
    return P.filter(filtro).sort(function (a, b) { return (b.valoracion || 0) - (a.valoracion || 0); })[0];
  }
  var A = mejor(function (p) { return p.estilo === "potencia"; }) || P[0];
  var B = mejor(function (p) { return p.estilo === "control" && p.id !== (A && A.id); }) || P[1] || P[0];

  function nombreCorto(n) { return n.replace(/\s+\d{4}.*$/, "").trim(); } // quita año y firma

  function render() {
    var cont = document.getElementById("hero-vs");
    if (!cont || !A || !B) return;
    var mA = metricas(A), mB = metricas(B);
    var dims = Object.keys(ICONOS);

    var filas = dims.map(function (d) {
      var a = mA[d], b = mB[d];
      return '<div class="vs-row">' +
        '<span class="vs-sc">' + a.toFixed(1) + "</span>" +
        '<div class="vs-bar a"><i style="width:' + (a * 10) + '%"></i></div>' +
        '<span class="vs-lab"><span class="vs-emo">' + ICONOS[d] + '</span> <span class="vs-txt">' + d + "</span></span>" +
        '<div class="vs-bar b"><i style="width:' + (b * 10) + '%"></i></div>' +
        '<span class="vs-sc">' + b.toFixed(1) + "</span>" +
      "</div>";
    }).join("");

    cont.innerHTML =
      '<div class="vs-top">' +
        '<a class="vs-pala" href="pala/' + A.id + '.html"><img src="' + A.imagen + '" alt="' + escAttr(A.nombre) + '" loading="lazy"><span>' + esc(nombreCorto(A.nombre)) + "</span></a>" +
        '<div class="vs-badge">VS</div>' +
        '<a class="vs-pala" href="pala/' + B.id + '.html"><img src="' + B.imagen + '" alt="' + escAttr(B.nombre) + '" loading="lazy"><span>' + esc(nombreCorto(B.nombre)) + "</span></a>" +
      "</div>" +
      '<div class="vs-stats">' + filas + "</div>";

    // "Ver comparativas" → preselecciona estas dos en el comparador
    var verComp = document.querySelector('.hero-cta .btn-outline');
    if (verComp) verComp.setAttribute("href", "index.html?comparar=" + A.id + "&comparar2=" + B.id + "#comparador");
  }

  function renderStrip() {
    var strip = document.getElementById("hero-strip");
    if (!strip) return;
    var marcas = {}; P.forEach(function (p) { marcas[p.marca] = 1; });
    var nMarcas = Object.keys(marcas).length;
    var items = [
      ["📦", "+" + (Math.floor(P.length / 50) * 50), "productos"],
      ["🏷️", "+" + (Math.floor(nMarcas / 5) * 5), "marcas"],
      ["🤖", "Comparador", "inteligente"],
      ["💬", "Opiniones", "verificadas"],
      ["🏷", "Precios", "actualizados"],
    ];
    strip.innerHTML = items.map(function (it) {
      return '<div class="hs"><span class="hs-ic">' + it[0] + "</span><div class=\"hs-tx\"><b>" + it[1] + "</b><span>" + it[2] + "</span></div></div>";
    }).join("");
  }

  function esc(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
  function escAttr(s) { return String(s).replace(/"/g, "&quot;"); }

  render();
  renderStrip();
})();
