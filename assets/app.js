/* ============================================================
   PadelCompare — lógica del comparador (JavaScript vanilla)
   Lee window.PRODUCTOS (datos/productos.js) y monta toda la UI.
   ============================================================ */
(function () {
  "use strict";

  var PRODUCTOS = window.PRODUCTOS || [];
  var MAX_COMPARAR = 4;
  var LOTE = 24;        // palas que se muestran por tanda
  var mostradas = LOTE; // cuántas hay visibles ahora mismo

  // -------- Estado --------
  var estado = {
    busqueda: "",
    niveles: [],
    estilos: [],
    formas: [],
    balances: [],
    marcas: [],
    tiendas: [],
    precioMax: 0,
    orden: "relevancia",
    comparar: [], // ids
  };

  // -------- Facetas --------
  var NIVELES = ["iniciación", "intermedio", "avanzado"];
  var ESTILOS = ["control", "potencia", "polivalente"];
  var FORMAS = ["redonda", "lágrima", "diamante"];
  var BALANCES = ["bajo", "medio", "alto"];

  function unicos(arr) { return arr.filter(function (v, i) { return arr.indexOf(v) === i; }); }
  var MARCAS = unicos(PRODUCTOS.map(function (p) { return p.marca; })).sort(function (a, b) { return a.localeCompare(b, "es"); });
  var PRECIOS = PRODUCTOS.map(function (p) { return p.precio; });
  var PRECIO_MIN = PRECIOS.length ? Math.floor(Math.min.apply(null, PRECIOS)) : 0;
  var PRECIO_MAX = PRECIOS.length ? Math.ceil(Math.max.apply(null, PRECIOS)) : 500;
  estado.precioMax = PRECIO_MAX;

  // -------- Utilidades --------
  function eur(n) {
    return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(n);
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function slug(s) { return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-"); }
  function descuento(p) {
    if (!p.precioOriginal || p.precioOriginal <= p.precio) return null;
    return Math.round((1 - p.precio / p.precioOriginal) * 100);
  }
  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) { if (k === "class") e.className = attrs[k]; else e.setAttribute(k, attrs[k]); }
    if (html != null) e.innerHTML = html;
    return e;
  }
  function badge(valor, prefijo) {
    return '<span class="badge b-' + slug(valor) + '">' + cap(valor) + '</span>';
  }

  // -------- Filtrado + orden --------
  function filtrar() {
    var q = estado.busqueda.trim().toLowerCase();
    var lista = PRODUCTOS.filter(function (p) {
      if (q && (p.marca + " " + p.nombre).toLowerCase().indexOf(q) === -1) return false;
      if (estado.niveles.length && estado.niveles.indexOf(p.nivel) === -1) return false;
      if (estado.estilos.length && estado.estilos.indexOf(p.estilo) === -1) return false;
      if (estado.formas.length && estado.formas.indexOf(p.forma) === -1) return false;
      if (estado.balances.length && estado.balances.indexOf(p.balance) === -1) return false;
      if (estado.marcas.length && estado.marcas.indexOf(p.marca) === -1) return false;
      if (p.precio > estado.precioMax) return false;
      return true;
    });
    lista.sort(function (a, b) {
      switch (estado.orden) {
        case "precio-asc": return a.precio - b.precio;
        case "precio-desc": return b.precio - a.precio;
        case "valoracion": return (b.valoracion || 0) - (a.valoracion || 0);
        default: return (b.popularidad || 0) - (a.popularidad || 0);
      }
    });
    return lista;
  }

  // -------- Render: tarjetas --------
  function tarjeta(p) {
    var sel = estado.comparar.indexOf(p.id) !== -1;
    var puede = estado.comparar.length < MAX_COMPARAR;
    var desc = descuento(p);
    var c = el("article", { class: "card" + (sel ? " selected" : "") });
    var ficha = "pala/" + p.id + ".html";
    c.innerHTML =
      '<a class="card-link" href="' + ficha + '">' +
      '<div class="card-img">' +
        '<span class="inicial">' + p.marca.charAt(0) + '</span>' +
        (p.imagen
          ? '<img class="card-foto" src="' + p.imagen + '" alt="' +
            String(p.nombre).replace(/"/g, "&quot;") +
            '" loading="lazy" onerror="this.remove()">'
          : "") +
        (desc != null ? '<span class="card-badge-desc">-' + desc + '%</span>' : '') +
      '</div></a>' +
      '<div class="card-body">' +
        '<div>' +
          '<p class="card-marca">' + p.marca + '</p>' +
          '<a class="card-link" href="' + ficha + '"><h3 class="card-nombre">' + p.nombre + '</h3></a>' +
        '</div>' +
        '<div class="badges">' +
          badge(p.nivel) + badge(p.estilo) + badge(p.forma) +
          '<span class="badge b-' + slug(p.balance) + '">Balance ' + p.balance + '</span>' +
        '</div>' +
        '<p class="card-desc">' + p.descripcion + '</p>' +
        '<div>' +
          (p.valoracion != null ? '<div class="card-rating"><span class="estrella">★</span> <b>' + p.valoracion.toFixed(1) + '</b></div>' : '') +
          '<div class="card-precio"><span class="actual">' + eur(p.precio) + '</span>' +
            (p.precioOriginal ? '<span class="original">' + eur(p.precioOriginal) + '</span>' : '') +
          '</div>' +
        '</div>' +
        '<div class="card-acciones">' +
          '<button class="btn-comparar ' + (sel ? "on" : (puede ? "add" : "")) + '"' + (!puede && !sel ? " disabled" : "") + ' data-comparar="' + p.id + '">' +
            (sel ? "✓ Comparando" : "Comparar") +
          '</button>' +
        '</div>' +
      '</div>';
    return c;
  }

  function renderGrid() {
    var lista = filtrar();
    var grid = document.getElementById("grid");
    var vacio = document.getElementById("vacio");
    var verMasWrap = document.getElementById("ver-mas-wrap");
    document.getElementById("contador").textContent = lista.length;
    grid.innerHTML = "";
    if (lista.length === 0) {
      grid.hidden = true; vacio.hidden = false; verMasWrap.hidden = true; return;
    }
    grid.hidden = false; vacio.hidden = true;
    if (mostradas > lista.length) mostradas = lista.length;
    var visibles = lista.slice(0, mostradas);
    visibles.forEach(function (p) { grid.appendChild(tarjeta(p)); });
    var restantes = lista.length - visibles.length;
    if (restantes > 0) {
      verMasWrap.hidden = false;
      document.getElementById("ver-mas").textContent =
        "Ver más palas (" + restantes + " restantes)";
    } else {
      verMasWrap.hidden = true;
    }
  }

  // Reinicia la paginación y repinta (al cambiar filtros/búsqueda/orden).
  function aplicarFiltros() {
    mostradas = LOTE;
    renderGrid();
  }

  // -------- Render: filtros --------
  function grupoCheck(titulo, opciones, clave, etiquetaFn) {
    var fs = el("div", { class: "filtro-grupo" });
    fs.appendChild(el("div", { class: "filtro-titulo" }, titulo));
    opciones.forEach(function (op) {
      var lab = el("label", { class: "filtro-opcion" });
      var checked = estado[clave].indexOf(op) !== -1 ? " checked" : "";
      lab.innerHTML = '<input type="checkbox"' + checked + ' data-grupo="' + clave + '" value="' + op + '">' +
        (etiquetaFn ? etiquetaFn(op) : cap(op));
      fs.appendChild(lab);
    });
    return fs;
  }

  function renderFiltros() {
    var cont = document.getElementById("filtros");
    cont.innerHTML = "";
    cont.appendChild(grupoCheck("Nivel", NIVELES, "niveles"));
    cont.appendChild(grupoCheck("Estilo de juego", ESTILOS, "estilos"));
    cont.appendChild(grupoCheck("Forma", FORMAS, "formas"));
    cont.appendChild(grupoCheck("Balance", BALANCES, "balances"));
    cont.appendChild(grupoCheck("Marca", MARCAS, "marcas", function (v) { return v; }));
  }

  // -------- Render: barra de comparación --------
  function productoPorId(id) {
    for (var i = 0; i < PRODUCTOS.length; i++) if (PRODUCTOS[i].id === id) return PRODUCTOS[i];
    return null;
  }

  function renderCompareBar() {
    var bar = document.getElementById("compare-bar");
    var n = estado.comparar.length;
    bar.hidden = n === 0;
    document.getElementById("compare-count").textContent = n;
    var chips = document.getElementById("compare-chips");
    chips.innerHTML = "";
    estado.comparar.forEach(function (id) {
      var p = productoPorId(id);
      if (!p) return;
      var chip = el("span", { class: "chip" }, p.nombre + ' <button data-quitar="' + id + '" aria-label="Quitar">✕</button>');
      chips.appendChild(chip);
    });
    document.getElementById("btn-comparar").disabled = n < 2;
  }

  // -------- Render: modal comparación --------
  var FILAS = [
    { etq: "Precio", val: function (p) { return '<b>' + eur(p.precio) + '</b>'; }, mejor: function (ps) { var m = Math.min.apply(null, ps.map(function (p) { return p.precio; })); return ps.map(function (p) { return p.precio; }).indexOf(m); } },
    { etq: "Valoración", val: function (p) { return p.valoracion != null ? "★ " + p.valoracion.toFixed(1) : "—"; }, mejor: function (ps) { var v = ps.map(function (p) { return p.valoracion || -1; }); var m = Math.max.apply(null, v); return m >= 0 ? v.indexOf(m) : -1; } },
    { etq: "Nivel", val: function (p) { return badge(p.nivel); } },
    { etq: "Estilo", val: function (p) { return badge(p.estilo); } },
    { etq: "Forma", val: function (p) { return badge(p.forma); } },
    { etq: "Balance", val: function (p) { return badge(p.balance); } },
    { etq: "Tacto", val: function (p) { return p.tacto || "—"; } },
    { etq: "Peso", val: function (p) { return p.peso || "—"; } },
    { etq: "Material marco", val: function (p) { return (p.material && p.material.marco) || "—"; } },
    { etq: "Material plano", val: function (p) { return (p.material && p.material.plano) || "—"; } },
    { etq: "Material goma", val: function (p) { return (p.material && p.material.goma) || "—"; } },
    { etq: "Temporada", val: function (p) { return p.temporada || p.anio || "—"; } },
  ];

  function abrirModal() {
    var ps = estado.comparar.map(productoPorId).filter(Boolean);
    if (ps.length < 2) return;
    document.getElementById("modal-count").textContent = ps.length;
    var tabla = document.getElementById("tabla-compara");
    var html = "<thead><tr><th></th>";
    ps.forEach(function (p) {
      html += '<th>' +
        (p.imagen ? '<img class="col-foto" src="' + p.imagen + '" alt="' + String(p.nombre).replace(/"/g, "&quot;") + '" onerror="this.remove()">' : '') +
        '<div class="col-marca">' + p.marca + '</div><div class="col-nombre">' + p.nombre + '</div>' +
        '<button class="quitar" data-quitar-modal="' + p.id + '">Quitar</button></th>';
    });
    html += "</tr></thead><tbody>";
    FILAS.forEach(function (f) {
      var mejor = f.mejor ? f.mejor(ps) : -1;
      html += '<tr><td class="etq">' + f.etq + '</td>';
      ps.forEach(function (p, i) {
        html += '<td' + (mejor === i ? ' class="mejor"' : '') + '>' + f.val(p) + '</td>';
      });
      html += "</tr>";
    });
    html += "</tbody>";
    tabla.innerHTML = html;
    document.getElementById("modal").hidden = false;
    document.body.style.overflow = "hidden";
  }

  function cerrarModal() {
    document.getElementById("modal").hidden = true;
    document.body.style.overflow = "";
  }

  // -------- Acciones --------
  function toggleComparar(id) {
    var i = estado.comparar.indexOf(id);
    if (i !== -1) estado.comparar.splice(i, 1);
    else if (estado.comparar.length < MAX_COMPARAR) estado.comparar.push(id);
    renderGrid();
    renderCompareBar();
  }

  function limpiar() {
    estado.busqueda = ""; estado.niveles = []; estado.estilos = []; estado.formas = [];
    estado.balances = []; estado.marcas = []; estado.tiendas = []; estado.precioMax = PRECIO_MAX;
    document.getElementById("buscador").value = "";
    document.getElementById("precio-range").value = PRECIO_MAX;
    document.getElementById("precio-max-val").textContent = eur(PRECIO_MAX);
    renderFiltros();
    aplicarFiltros();
  }

  // -------- Inicialización --------
  function init() {
    // Precio
    var range = document.getElementById("precio-range");
    range.min = PRECIO_MIN; range.max = PRECIO_MAX; range.value = PRECIO_MAX;
    document.getElementById("precio-min").textContent = eur(PRECIO_MIN);
    document.getElementById("precio-max-val").textContent = eur(PRECIO_MAX);

    renderFiltros();

    // Si venimos con ?comparar=<id> (ficha) o ?comparar2=<id> (VS del hero),
    // pre-seleccionamos esas palas en el comparador.
    try {
      var params = new URLSearchParams(location.search);
      ["comparar", "comparar2"].forEach(function (k) {
        var id = params.get(k);
        if (id && productoPorId(id) && estado.comparar.indexOf(id) === -1 && estado.comparar.length < MAX_COMPARAR) {
          estado.comparar.push(id);
        }
      });
    } catch (e) {}

    renderGrid();
    renderCompareBar();

    // Eventos: filtros (delegación)
    document.getElementById("filtros").addEventListener("change", function (e) {
      var cb = e.target;
      if (cb.tagName !== "INPUT") return;
      var grupo = cb.getAttribute("data-grupo");
      var val = cb.value;
      var arr = estado[grupo];
      var idx = arr.indexOf(val);
      if (cb.checked && idx === -1) arr.push(val);
      else if (!cb.checked && idx !== -1) arr.splice(idx, 1);
      aplicarFiltros();
    });

    // Buscador
    document.getElementById("buscador").addEventListener("input", function (e) {
      estado.busqueda = e.target.value; aplicarFiltros();
    });
    // Orden
    document.getElementById("orden").addEventListener("change", function (e) {
      estado.orden = e.target.value; aplicarFiltros();
    });
    // Precio
    range.addEventListener("input", function (e) {
      estado.precioMax = Number(e.target.value);
      document.getElementById("precio-max-val").textContent = eur(estado.precioMax);
      aplicarFiltros();
    });
    // Ver más palas
    document.getElementById("ver-mas").addEventListener("click", function () {
      mostradas += LOTE; renderGrid();
    });

    // Grid: botón comparar (delegación)
    document.getElementById("grid").addEventListener("click", function (e) {
      var b = e.target.closest("[data-comparar]");
      if (b) toggleComparar(b.getAttribute("data-comparar"));
    });
    // Barra: quitar chip / vaciar / comparar
    document.getElementById("compare-chips").addEventListener("click", function (e) {
      var b = e.target.closest("[data-quitar]");
      if (b) toggleComparar(b.getAttribute("data-quitar"));
    });
    document.getElementById("btn-vaciar").addEventListener("click", function () {
      estado.comparar = []; renderGrid(); renderCompareBar();
    });
    document.getElementById("btn-comparar").addEventListener("click", abrirModal);

    // Modal
    document.getElementById("btn-cerrar-modal").addEventListener("click", cerrarModal);
    document.getElementById("modal").addEventListener("click", function (e) {
      if (e.target.id === "modal") cerrarModal();
      var b = e.target.closest("[data-quitar-modal]");
      if (b) {
        toggleComparar(b.getAttribute("data-quitar-modal"));
        if (estado.comparar.length < 2) cerrarModal(); else abrirModal();
      }
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") cerrarModal(); });

    // Limpiar
    document.getElementById("btn-limpiar").addEventListener("click", limpiar);
    document.getElementById("btn-limpiar-2").addEventListener("click", limpiar);

    // Filtros móvil
    document.getElementById("btn-filtros-movil").addEventListener("click", function () {
      document.getElementById("sidebar").classList.toggle("open");
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
