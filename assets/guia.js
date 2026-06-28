/* ============================================================
   Botón flotante "Recomendaciones" · Padel Ideal
   Abre un pop-up con la guía "Elige tu pala" (assets/eligetupala.webp)
   para ayudar a elegir según nivel, control/potencia, forma y balance.
   ============================================================ */
(function () {
  "use strict";

  var css = document.createElement("style");
  css.textContent =
    "#guia-fab{position:fixed;right:92px;bottom:24px;z-index:9997;display:inline-flex;align-items:center;gap:8px;" +
      "background:linear-gradient(135deg,#ff2d2d,#b00d18);color:#fff;border:none;border-radius:30px;padding:14px 18px;cursor:pointer;" +
      "font:600 14px system-ui,-apple-system,Arial,sans-serif;box-shadow:0 8px 24px rgba(16,32,24,.25);transition:background .15s}" +
    "#guia-fab:hover{background:linear-gradient(135deg,#f01f24,#8e0e16)}" +
    "#guia-modal{position:fixed;inset:0;z-index:9999;background:rgba(22,32,26,.6);backdrop-filter:blur(4px);" +
      "display:none;align-items:flex-start;justify-content:center;overflow-y:auto;padding:20px}" +
    "#guia-modal.open{display:flex}" +
    "#guia-card{background:#fff;border-radius:16px;max-width:640px;width:100%;margin:20px 0;overflow:hidden;" +
      "box-shadow:0 20px 60px rgba(0,0,0,.3);font-family:system-ui,-apple-system,Arial,sans-serif}" +
    "#guia-head{position:sticky;top:0;background:#fff;display:flex;justify-content:space-between;align-items:center;" +
      "padding:14px 18px;border-bottom:1px solid #e3e7e2}" +
    "#guia-head b{font-size:16px;color:#16201a}" +
    "#guia-head .sub{font-size:12px;color:#5d6b62}" +
    "#guia-close{background:none;border:none;font-size:20px;cursor:pointer;color:#5d6b62;line-height:1}" +
    "#guia-card img{display:block;width:100%;height:auto}" +
    "@media(max-width:900px){#guia-fab{right:auto;left:16px;bottom:20px;padding:12px 16px}}";
  document.head.appendChild(css);

  function montar() {
    var fab = document.createElement("button");
    fab.id = "guia-fab";
    fab.innerHTML = '<span style="font-size:18px">💡</span> Recomendaciones';
    fab.title = "Cómo elegir tu pala";
    document.body.appendChild(fab);

    var modal = document.createElement("div");
    modal.id = "guia-modal";
    modal.innerHTML =
      '<div id="guia-card">' +
        '<div id="guia-head"><div><b>Cómo elegir tu pala</b>' +
          '<div class="sub">Guía rápida por nivel, control/potencia, forma y balance</div></div>' +
          '<button id="guia-close" aria-label="Cerrar">✕</button></div>' +
        '<img src="assets/eligetupala.webp" alt="Guía para elegir tu pala de pádel: palas blandas y duras, forma, balance y punto dulce" loading="lazy">' +
      '</div>';
    document.body.appendChild(modal);

    function abrir() { modal.classList.add("open"); document.body.style.overflow = "hidden"; }
    function cerrar() { modal.classList.remove("open"); document.body.style.overflow = ""; }
    fab.addEventListener("click", abrir);
    document.getElementById("guia-close").addEventListener("click", cerrar);
    modal.addEventListener("click", function (e) { if (e.target.id === "guia-modal") cerrar(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") cerrar(); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", montar);
  else montar();
})();
