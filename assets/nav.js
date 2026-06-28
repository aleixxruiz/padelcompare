/* ============================================================
   Menú hamburguesa para móvil. Inyecta un botón en la cabecera que
   despliega/oculta el menú (.nav) en pantallas pequeñas.
   Se incluye en todas las páginas; funciona sin tocar el HTML de cada cabecera.
   ============================================================ */
(function () {
  "use strict";
  function init() {
    var inner = document.querySelector(".header-inner");
    var nav = inner && inner.querySelector(".nav");
    if (!inner || !nav || inner.querySelector(".nav-toggle")) return;

    var btn = document.createElement("button");
    btn.className = "nav-toggle";
    btn.setAttribute("aria-label", "Abrir menú");
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML = "☰";
    inner.appendChild(btn);

    function abrir(estado) {
      nav.classList.toggle("open", estado);
      btn.setAttribute("aria-expanded", estado ? "true" : "false");
      btn.innerHTML = estado ? "✕" : "☰";
    }

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      abrir(!nav.classList.contains("open"));
    });
    // Cerrar al pulsar un enlace o al tocar fuera
    nav.addEventListener("click", function (e) { if (e.target.tagName === "A") abrir(false); });
    document.addEventListener("click", function (e) {
      if (nav.classList.contains("open") && !nav.contains(e.target) && e.target !== btn) abrir(false);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
