/* ============================================================
   Padel Ideal — "Recomendadas para ti"
   Lee el perfil del usuario (Supabase) y recomienda palas de window.PRODUCTOS.
   ============================================================ */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var PRODUCTOS = window.PRODUCTOS || [];

  function aviso(html) { var a = $("reco-aviso"); a.innerHTML = html; a.hidden = false; }
  function eur(n) { return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n); }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  function slug(s) { return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-"); }

  function nivelDesdePlaytomic(n) {
    if (n == null) return null;
    if (n < 3) return "iniciación";
    if (n < 4.5) return "intermedio";
    return "avanzado";
  }

  function recomendar(p) {
    var nivel = nivelDesdePlaytomic(p.nivel_playtomic);
    var estilo = p.estilo && p.estilo !== "indiferente" ? p.estilo : null;
    // Si juega de revés, suele encajar más potencia/diamante; si es por molestias
    // de codo, priorizamos palas blandas/control.
    var pasa = function (x, usarEstilo, usarPresu) {
      if (nivel && x.nivel !== nivel) return false;
      if (usarEstilo && estilo && x.estilo !== estilo) return false;
      if (usarPresu && p.presupuesto && x.precio > p.presupuesto) return false;
      return true;
    };
    var lista = PRODUCTOS.filter(function (x) { return pasa(x, true, true); });
    if (lista.length < 6) lista = PRODUCTOS.filter(function (x) { return pasa(x, false, true); });
    if (lista.length < 6) lista = PRODUCTOS.filter(function (x) { return pasa(x, false, false); });

    // Puntuación para ordenar: valoración + bonus por encajar estilo + ajuste lesión codo
    lista.forEach(function (x) {
      var s = (x.valoracion || 0) * 2;
      if (estilo && x.estilo === estilo) s += 1.5;
      if (p.lesion_codo && (x.balance === "bajo" || x.estilo === "control")) s += 1.2;
      if (p.presupuesto && x.precio <= p.presupuesto) s += 0.5;
      x._score = s;
    });
    lista.sort(function (a, b) { return b._score - a._score; });
    return { nivel: nivel, estilo: estilo, lista: lista.slice(0, 12) };
  }

  function porque(x, ctx, perfil) {
    var r = [];
    if (ctx.nivel && x.nivel === ctx.nivel) r.push("nivel " + ctx.nivel);
    if (ctx.estilo && x.estilo === ctx.estilo) r.push("estilo " + ctx.estilo);
    if (perfil.presupuesto && x.precio <= perfil.presupuesto) r.push("dentro de tu presupuesto");
    if (perfil.lesion_codo && (x.balance === "bajo" || x.estilo === "control")) r.push("suave para el codo");
    if (x.valoracion >= 4.3) r.push("muy bien valorada");
    return r.slice(0, 3).join(" · ");
  }

  function tarjeta(x, ctx, perfil) {
    var c = document.createElement("article");
    c.className = "card";
    var b = function (v) { return '<span class="badge b-' + slug(v) + '">' + cap(v) + "</span>"; };
    var ficha = "pala/" + x.id + ".html";
    c.innerHTML =
      '<a class="card-link" href="' + ficha + '">' +
      '<div class="card-img">' +
        '<span class="inicial">' + x.marca.charAt(0) + "</span>" +
        (x.imagen ? '<img class="card-foto" src="' + x.imagen + '" alt="' + String(x.nombre).replace(/"/g, "&quot;") + '" loading="lazy" onerror="this.remove()">' : "") +
      "</div></a>" +
      '<div class="card-body">' +
        '<div><p class="card-marca">' + x.marca + '</p><a class="card-link" href="' + ficha + '"><h3 class="card-nombre">' + x.nombre + "</h3></a></div>" +
        '<div class="badges">' + b(x.nivel) + b(x.estilo) + b(x.forma) + "</div>" +
        '<p class="reco-porque">✓ ' + (porque(x, ctx, perfil) || "buena opción para ti") + "</p>" +
        '<div class="card-precio" style="margin-top:auto">' +
          '<span class="actual">' + eur(x.precio) + "</span>" +
          (x.precioOriginal ? '<span class="original">' + eur(x.precioOriginal) + "</span>" : "") +
        "</div>" +
      "</div>";
    return c;
  }

  function render(perfil) {
    var ctx = recomendar(perfil);
    var sub = [];
    if (ctx.nivel) sub.push("nivel " + ctx.nivel);
    if (ctx.estilo) sub.push("estilo " + ctx.estilo);
    if (perfil.presupuesto) sub.push("hasta " + eur(perfil.presupuesto));
    $("reco-sub").textContent = sub.length ? "Según tu perfil: " + sub.join(" · ") + "." : "Tus mejores palas según tu perfil.";
    $("reco-resumen").textContent = ctx.lista.length + " palas recomendadas";
    var grid = $("reco-grid");
    grid.innerHTML = "";
    ctx.lista.forEach(function (x) { grid.appendChild(tarjeta(x, ctx, perfil)); });
  }

  // -------- Arranque --------
  if (!window.sb) {
    aviso("<b>Falta configurar Supabase.</b> Edita <code>assets/supabase-config.js</code>. Ver <code>SETUP-SUPABASE.md</code>.");
    return;
  }
  window.sb.auth.getSession().then(function (res) {
    var session = res.data.session;
    if (!session) {
      aviso('Para ver tus recomendaciones, <a href="cuenta.html">entra y completa tu perfil</a>.');
      return;
    }
    window.sb.from("perfiles").select("*").eq("id", session.user.id).maybeSingle().then(function (r) {
      if (!r.data || r.data.nivel_playtomic == null) {
        aviso('Completa tu <a href="cuenta.html">perfil de jugador</a> (al menos el nivel) para recibir recomendaciones.');
        if (r.data) render(r.data);
        return;
      }
      render(r.data);
    });
  });
})();
