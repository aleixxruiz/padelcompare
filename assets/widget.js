/* ============================================================
   Asistente IA flotante · PadelCompare
   - Botón flotante que abre un chat.
   - Envía la pregunta + el catálogo (window.PRODUCTOS) a un
     Cloudflare Worker (CONFIG.aiUrl) que llama a Claude con el
     system prompt de pádel y devuelve la recomendación.
   - Si aiUrl no está configurado, muestra instrucciones.
   ============================================================ */
(function () {
  "use strict";

  var CONFIG = {
    // 1) Despliega worker/padel-worker.js en Cloudflare Workers.
    // 2) Pega aquí la URL pública del worker (https://....workers.dev/).
    aiUrl: "",
    titulo: "Asesor de pádel IA",
    bienvenida: "¡Hola! 🎾 Cuéntame tu nivel, presupuesto y estilo de juego y te recomiendo la mejor pala de nuestro catálogo.",
  };

  var historial = []; // [{role:'user'|'assistant', content:'...'}]
  var enviando = false;

  // -------- Estilos --------
  var css = document.createElement("style");
  css.textContent =
    "#pc-fab{position:fixed;right:20px;bottom:20px;z-index:9998;width:60px;height:60px;border-radius:50%;border:none;cursor:pointer;background:#1f9d55;color:#fff;font-size:26px;box-shadow:0 8px 24px rgba(16,32,24,.25);transition:transform .15s}" +
    "#pc-fab:hover{transform:scale(1.06)}" +
    "#pc-panel{position:fixed;right:20px;bottom:90px;z-index:9998;width:360px;max-width:calc(100vw - 40px);height:520px;max-height:calc(100vh - 120px);background:#fff;border:1px solid #e3e7e2;border-radius:18px;box-shadow:0 20px 60px rgba(0,0,0,.22);display:none;flex-direction:column;overflow:hidden;font-family:system-ui,-apple-system,Arial,sans-serif}" +
    "#pc-panel.open{display:flex}" +
    "#pc-head{background:linear-gradient(135deg,#14773f,#1f9d55);color:#fff;padding:14px 16px;display:flex;align-items:center;justify-content:space-between}" +
    "#pc-head b{font-size:15px}" +
    "#pc-head .sub{font-size:12px;opacity:.85}" +
    "#pc-close{background:none;border:none;color:#fff;font-size:18px;cursor:pointer}" +
    "#pc-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:#f6f7f5}" +
    ".pc-msg{max-width:85%;padding:10px 12px;border-radius:14px;font-size:14px;line-height:1.45;white-space:pre-wrap;word-wrap:break-word}" +
    ".pc-msg.bot{background:#fff;border:1px solid #e3e7e2;align-self:flex-start;border-bottom-left-radius:4px}" +
    ".pc-msg.user{background:#1f9d55;color:#fff;align-self:flex-end;border-bottom-right-radius:4px}" +
    ".pc-msg.bot a{color:#14773f}" +
    "#pc-foot{border-top:1px solid #e3e7e2;padding:10px;display:flex;gap:8px;background:#fff}" +
    "#pc-input{flex:1;border:1px solid #e3e7e2;border-radius:12px;padding:10px 12px;font-size:14px;outline:none;resize:none;max-height:90px;font-family:inherit}" +
    "#pc-send{border:none;background:#1f9d55;color:#fff;border-radius:12px;padding:0 16px;font-weight:600;cursor:pointer}" +
    "#pc-send:disabled{opacity:.5;cursor:not-allowed}" +
    ".pc-dots span{display:inline-block;width:6px;height:6px;margin:0 1px;border-radius:50%;background:#5d6b62;animation:pcblink 1.2s infinite}" +
    ".pc-dots span:nth-child(2){animation-delay:.2s}.pc-dots span:nth-child(3){animation-delay:.4s}" +
    "@keyframes pcblink{0%,60%,100%{opacity:.2}30%{opacity:1}}";
  document.head.appendChild(css);

  // -------- DOM --------
  function montar() {
    var fab = document.createElement("button");
    fab.id = "pc-fab"; fab.innerHTML = "🎾"; fab.title = CONFIG.titulo;
    document.body.appendChild(fab);

    var panel = document.createElement("div");
    panel.id = "pc-panel";
    panel.innerHTML =
      '<div id="pc-head"><div><b>' + CONFIG.titulo + '</b><div class="sub">Recomendaciones de nuestro catálogo</div></div>' +
        '<button id="pc-close" aria-label="Cerrar">✕</button></div>' +
      '<div id="pc-msgs"></div>' +
      '<div id="pc-foot">' +
        '<textarea id="pc-input" rows="1" placeholder="Escribe tu pregunta…"></textarea>' +
        '<button id="pc-send">Enviar</button>' +
      '</div>';
    document.body.appendChild(panel);

    var msgs = panel.querySelector("#pc-msgs");
    var input = panel.querySelector("#pc-input");
    var send = panel.querySelector("#pc-send");

    function addMsg(role, text) {
      var d = document.createElement("div");
      d.className = "pc-msg " + (role === "user" ? "user" : "bot");
      d.innerHTML = role === "user" ? escapar(text) : formatear(text);
      msgs.appendChild(d);
      msgs.scrollTop = msgs.scrollHeight;
      return d;
    }
    function escapar(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
    function formatear(s) {
      // Markdown mínimo: **negrita**, saltos de línea y enlaces.
      return escapar(s)
        .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
        .replace(/(https?:\/\/[^\s)]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    }

    addMsg("bot", CONFIG.bienvenida);

    function abrir() { panel.classList.add("open"); input.focus(); }
    function cerrar() { panel.classList.remove("open"); }
    fab.addEventListener("click", function () { panel.classList.contains("open") ? cerrar() : abrir(); });
    panel.querySelector("#pc-close").addEventListener("click", cerrar);

    input.addEventListener("input", function () {
      input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 90) + "px";
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); }
    });
    send.addEventListener("click", enviar);

    function enviar() {
      var texto = input.value.trim();
      if (!texto || enviando) return;

      if (!CONFIG.aiUrl) {
        addMsg("user", texto);
        input.value = ""; input.style.height = "auto";
        addMsg("bot",
          "El asistente todavía no está conectado. Para activarlo:\n" +
          "1) Despliega worker/padel-worker.js en Cloudflare Workers.\n" +
          "2) Añade tu ANTHROPIC_API_KEY como variable secreta.\n" +
          "3) Pega la URL del worker en CONFIG.aiUrl (assets/widget.js).\n" +
          "Mientras tanto, usa los filtros y la comparación de la web. 🎾");
        return;
      }

      addMsg("user", texto);
      historial.push({ role: "user", content: texto });
      input.value = ""; input.style.height = "auto";

      enviando = true; send.disabled = true;
      var pensando = addMsg("bot", "");
      pensando.innerHTML = '<span class="pc-dots"><span></span><span></span><span></span></span>';

      fetch(CONFIG.aiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: texto,
          history: historial.slice(0, -1),
          productos: window.PRODUCTOS || [],
        }),
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          var respuesta = (data && (data.reply || data.text)) || "Lo siento, no he podido generar una respuesta.";
          pensando.innerHTML = formatear(respuesta);
          historial.push({ role: "assistant", content: respuesta });
          msgs.scrollTop = msgs.scrollHeight;
        })
        .catch(function () {
          pensando.innerHTML = formatear("Ha habido un problema conectando con el asistente. Inténtalo de nuevo en un momento.");
        })
        .finally(function () { enviando = false; send.disabled = false; });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", montar);
  else montar();
})();
