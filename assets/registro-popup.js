/* ============================================================
   Popup de invitación a registrarse (solo para visitantes sin sesión)
   Aparece una vez por sesión, tras un tiempo o al hacer scroll, e invita a
   crear cuenta para desbloquear las recomendaciones personalizadas.
   ============================================================ */
(function () {
  "use strict";

  var CERRADO = "pm_reg_popup_cerrado";
  try { if (sessionStorage.getItem(CERRADO)) return; } catch (e) {}

  var mostrado = false;

  function cerrar() {
    var ov = document.getElementById("reg-pop");
    if (ov) ov.classList.remove("open");
    try { sessionStorage.setItem(CERRADO, "1"); } catch (e) {}
  }

  function mostrar() {
    if (mostrado) return;
    mostrado = true;

    var css = document.createElement("style");
    css.textContent =
      "#reg-pop{position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;" +
        "background:rgba(22,32,26,.55);backdrop-filter:blur(4px);padding:20px}" +
      "#reg-pop.open{display:flex;animation:regfade .2s ease}" +
      "@keyframes regfade{from{opacity:0}to{opacity:1}}" +
      "#reg-pop-card{background:#fff;border-radius:18px;max-width:420px;width:100%;padding:28px 24px;text-align:center;" +
        "box-shadow:0 24px 70px rgba(0,0,0,.3);font-family:system-ui,-apple-system,Arial,sans-serif;position:relative}" +
      "#reg-pop-close{position:absolute;top:12px;right:14px;background:none;border:none;font-size:20px;color:#5d6b62;cursor:pointer;line-height:1}" +
      "#reg-pop-card .emoji{font-size:40px;line-height:1}" +
      "#reg-pop-card h3{margin:10px 0 6px;font-size:21px;color:#16201a}" +
      "#reg-pop-card p{margin:0 0 18px;color:#5d6b62;font-size:15px;line-height:1.5}" +
      "#reg-pop-card .reg-cta{display:block;width:100%;background:linear-gradient(135deg,#ff2d2d,#b00d18);color:#fff;border:none;border-radius:12px;" +
        "padding:13px;font-size:15px;font-weight:700;cursor:pointer;text-decoration:none;margin-bottom:8px}" +
      "#reg-pop-card .reg-cta:hover{background:linear-gradient(135deg,#f01f24,#8e0e16)}" +
      "#reg-pop-card .reg-no{background:none;border:none;color:#5d6b62;font-size:14px;cursor:pointer;text-decoration:underline}";
    document.head.appendChild(css);

    var ov = document.createElement("div");
    ov.id = "reg-pop";
    ov.innerHTML =
      '<div id="reg-pop-card">' +
        '<button id="reg-pop-close" aria-label="Cerrar">✕</button>' +
        '<div class="emoji">🎾</div>' +
        "<h3>Descubre tu pala ideal</h3>" +
        "<p>Regístrate gratis y te recomendamos las mejores palas según tu nivel " +
          "Playtomic y tu forma de jugar. ¡Es rápido y sin compromiso!</p>" +
        '<a class="reg-cta" href="cuenta.html">Crear cuenta gratis →</a>' +
        '<button class="reg-no" type="button">Ahora no, seguir mirando</button>' +
      "</div>";
    document.body.appendChild(ov);
    // forzar reflow para la animación y abrir
    requestAnimationFrame(function () { ov.classList.add("open"); });

    document.getElementById("reg-pop-close").addEventListener("click", cerrar);
    ov.querySelector(".reg-no").addEventListener("click", cerrar);
    ov.addEventListener("click", function (e) { if (e.target.id === "reg-pop") cerrar(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") cerrar(); });
  }

  function programar() {
    // Aparece a los 12 s o cuando el usuario se desplaza mirando productos.
    var t = setTimeout(mostrar, 12000);
    function onScroll() {
      if (window.scrollY > 1000) { clearTimeout(t); window.removeEventListener("scroll", onScroll); mostrar(); }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // Solo a quien NO tiene sesión iniciada.
  function arrancar() {
    if (window.sb) {
      window.sb.auth.getSession().then(function (res) {
        if (!res.data.session) programar();
      });
    } else {
      programar(); // Supabase no configurado: igualmente invitamos a registrarse
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arrancar);
  else arrancar();
})();
