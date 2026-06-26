/* ============================================================
   Pantalla de contraseña de PadelCompare (disuasoria)
   - Cubre la página hasta introducir la contraseña correcta.
   - La contraseña NO está en el código: solo su hash SHA-256.
   - Recuerda el acceso mientras el navegador esté abierto (sessionStorage).

   CONTRASEÑA POR DEFECTO: padel2026
   Para cambiarla: calcula el SHA-256 de la nueva contraseña y pégalo en HASH.
     macOS/Linux:  printf '%s' 'TU_CLAVE' | shasum -a 256
   Para DESACTIVAR la barrera: borra <script src="assets/gate.js"> de index.html.

   NOTA: es una barrera visual. En una web estática los datos siguen siendo
   accesibles por URL directa. Para bloqueo real usa Cloudflare Access o similar.
   ============================================================ */
(function () {
  var KEY = "padel_unlocked_v1";
  var HASH = "d97c0fc29ac6ac54b2e8fcc3239c8c57633edde5a77ce4819828189e6f837bcc";

  // En local (file://) no pedimos contraseña: son tus propios archivos.
  if (location.protocol === "file:") return;
  // Sin Web Crypto (contexto no seguro) no bloqueamos para no dejar la web inaccesible.
  if (!(window.crypto && window.crypto.subtle)) return;
  try { if (sessionStorage.getItem(KEY) === "1") return; } catch (e) {}

  // Ocultar la página de inmediato para evitar parpadeo.
  document.documentElement.style.visibility = "hidden";

  function sha256(txt) {
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(txt)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) {
        return ("0" + b.toString(16)).slice(-2);
      }).join("");
    });
  }

  function montar() {
    var overlay = document.createElement("div");
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;" +
      "background:linear-gradient(135deg,#14773f,#1f9d55);font-family:system-ui,-apple-system,Arial,sans-serif;";
    overlay.innerHTML =
      '<form id="gate-form" style="background:#fff;padding:32px 28px;border-radius:18px;box-shadow:0 20px 60px rgba(0,0,0,.3);width:320px;text-align:center;">' +
        '<div style="font-size:40px;line-height:1">🎾</div>' +
        '<h1 style="margin:10px 0 4px;font-size:20px;color:#16201a">PadelCompare</h1>' +
        '<p style="margin:0 0 18px;color:#5d6b62;font-size:14px">Introduce la contraseña para acceder</p>' +
        '<input id="gate-input" type="password" autocomplete="current-password" placeholder="Contraseña" ' +
          'style="width:100%;padding:11px 14px;border:1px solid #e3e7e2;border-radius:10px;font-size:15px;outline:none;box-sizing:border-box" autofocus>' +
        '<p id="gate-error" style="color:#e11d48;font-size:13px;min-height:18px;margin:8px 0 0">&nbsp;</p>' +
        '<button type="submit" style="width:100%;margin-top:4px;padding:11px;border:none;border-radius:10px;background:#1f9d55;color:#fff;font-size:15px;font-weight:600;cursor:pointer">Entrar</button>' +
      "</form>";
    document.body.appendChild(overlay);
    document.documentElement.style.visibility = "";

    var input = document.getElementById("gate-input");
    input.focus();
    document.getElementById("gate-form").addEventListener("submit", function (e) {
      e.preventDefault();
      sha256(input.value).then(function (h) {
        if (h === HASH) {
          try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
          overlay.remove();
        } else {
          document.getElementById("gate-error").textContent = "Contraseña incorrecta";
          input.value = ""; input.focus();
        }
      });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", montar);
  else montar();
})();
