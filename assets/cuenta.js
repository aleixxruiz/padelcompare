/* ============================================================
   Padel Ideal — login (enlace mágico) + perfil de jugador (Supabase)
   El formulario se genera dinámicamente desde assets/perfil-schema.js:
   comunes → columnas; cada categoría activa → columnas (si tiene "store")
   o preferencias[categoria][campo] (JSONB).
   ============================================================ */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };

  if (!window.sb) { $("estado-config").hidden = false; return; }
  var sb = window.sb;
  var SCHEMA = window.PERFIL_SCHEMA;

  function mostrar(seccion) {
    $("login-box").hidden = seccion !== "login";
    $("perfil-box").hidden = seccion !== "perfil";
  }

  // -------- Login por enlace mágico --------
  $("login-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var email = $("login-email").value.trim();
    var msg = $("login-msg");
    if (!email) return;
    msg.textContent = "Enviando…"; msg.className = "cuenta-msg";
    sb.auth.signInWithOtp({ email: email, options: { emailRedirectTo: location.origin + location.pathname } })
      .then(function (res) {
        if (res.error) { msg.textContent = "Error: " + res.error.message; msg.className = "cuenta-msg err"; }
        else { msg.textContent = "✓ Revisa tu correo y pulsa el enlace para entrar."; msg.className = "cuenta-msg ok"; }
      });
  });

  // -------- Construcción del formulario desde el esquema --------
  function campoId(cat, f) { return "f__" + (cat || "comun") + "__" + f.id; }

  function htmlCampo(cat, f) {
    var id = campoId(cat, f);
    if (f.tipo === "check") {
      return '<label class="campo check"><input type="checkbox" id="' + id + '"><span>' + f.label + "</span></label>";
    }
    var control;
    if (f.tipo === "select") {
      control = '<select id="' + id + '">' +
        f.opciones.map(function (o) { return '<option value="' + o[0] + '">' + o[1] + "</option>"; }).join("") +
        "</select>";
    } else {
      var attrs = ['type="' + (f.tipo || "text") + '"', 'id="' + id + '"'];
      if (f.min != null) attrs.push('min="' + f.min + '"');
      if (f.max != null) attrs.push('max="' + f.max + '"');
      if (f.step != null) attrs.push('step="' + f.step + '"');
      if (f.ph) attrs.push('placeholder="' + f.ph + '"');
      if (f.autocomplete) attrs.push('autocomplete="' + f.autocomplete + '"');
      control = "<input " + attrs.join(" ") + ">";
    }
    return '<label class="campo"><span>' + f.label + "</span>" + control + "</label>";
  }

  function construirFormulario() {
    var html = '<div class="perfil-cat"><h3>📋 Datos básicos</h3><div class="form-grid">' +
      SCHEMA.comunes.map(function (f) { return htmlCampo(null, f); }).join("") + "</div></div>";
    SCHEMA.categorias.filter(function (c) { return c.activa; }).forEach(function (c) {
      html += '<div class="perfil-cat"><h3>' + c.icon + " " + c.label + "</h3>" +
        '<div class="form-grid">' + c.campos.map(function (f) { return htmlCampo(c.key, f); }).join("") + "</div></div>";
    });
    $("perfil-campos").innerHTML = html;
  }

  // -------- Foto de perfil (Supabase Storage) --------
  function mostrarAvatar(url) {
    var img = $("avatar-img");
    if (url) { img.src = url; img.hidden = false; $("avatar-ph").hidden = true; $("avatar-quitar").hidden = false; }
    else { img.hidden = true; img.removeAttribute("src"); $("avatar-ph").hidden = false; $("avatar-quitar").hidden = true; }
  }

  function initAvatar() {
    var input = $("avatar-input");
    if (!input || input.dataset.listo) return;
    input.dataset.listo = "1";
    input.addEventListener("change", function () {
      var file = input.files && input.files[0];
      var uid = $("perfil-form").dataset.uid;
      var msg = $("avatar-msg");
      if (!file || !uid) return;
      if (!/^image\//.test(file.type)) { msg.textContent = "Selecciona una imagen."; msg.className = "cuenta-msg err"; return; }
      if (file.size > 3 * 1024 * 1024) { msg.textContent = "La imagen no debe superar 3 MB."; msg.className = "cuenta-msg err"; return; }
      var ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      var path = uid + "/avatar." + ext;
      msg.textContent = "Subiendo…"; msg.className = "cuenta-msg";
      sb.storage.from("avatares").upload(path, file, { upsert: true, contentType: file.type }).then(function (res) {
        if (res.error) { msg.textContent = "Error al subir: " + res.error.message; msg.className = "cuenta-msg err"; return; }
        var url = sb.storage.from("avatares").getPublicUrl(path).data.publicUrl + "?v=" + Date.now();
        sb.from("perfiles").update({ avatar_url: url }).eq("id", uid).then(function (r) {
          if (r.error) { msg.textContent = "Subida ok, pero no se guardó: " + r.error.message; msg.className = "cuenta-msg err"; }
          else { msg.textContent = "✓ Foto actualizada."; msg.className = "cuenta-msg ok"; }
        });
        mostrarAvatar(url);
      });
    });
    $("avatar-quitar").addEventListener("click", function () {
      var uid = $("perfil-form").dataset.uid;
      sb.from("perfiles").update({ avatar_url: null }).eq("id", uid).then(function () {
        mostrarAvatar(null); $("avatar-msg").textContent = "";
      });
    });
  }

  function recorrer(fn) {
    SCHEMA.comunes.forEach(function (f) { fn(null, f); });
    SCHEMA.categorias.filter(function (c) { return c.activa; }).forEach(function (c) {
      c.campos.forEach(function (f) { fn(c.key, f); });
    });
  }

  function setValor(el, f, val) {
    if (!el) return;
    if (f.tipo === "check") el.checked = !!val;
    else el.value = val != null ? val : "";
  }
  function getValor(el, f) {
    if (!el) return null;
    if (f.tipo === "check") return el.checked;
    if (el.value === "") return null;
    return f.tipo === "number" ? Number(el.value) : el.value;
  }

  // -------- Cargar / guardar perfil --------
  function cargarPerfil(user) {
    var form = $("perfil-form");
    form.dataset.uid = user.id;
    form.dataset.email = user.email || "";
    sb.from("perfiles").select("*").eq("id", user.id).maybeSingle().then(function (res) {
      var p = res.data || {};
      form._preferencias = p.preferencias || {};
      recorrer(function (cat, f) {
        var el = $(campoId(cat, f));
        var val;
        if (f.store) val = p[f.store];                       // columna
        else val = (p.preferencias && p.preferencias[cat]) ? p.preferencias[cat][f.id] : undefined; // JSONB
        setValor(el, f, val);
      });
      if (!p.nombre && user.user_metadata && user.user_metadata.full_name) {
        var nEl = $(campoId(null, { id: "nombre" })); if (nEl) nEl.value = user.user_metadata.full_name;
      }
      $("f-consent").checked = !!p.consentimiento;
      mostrarAvatar(p.avatar_url);
    });
  }

  $("perfil-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var form = $("perfil-form");
    var msg = $("perfil-msg");
    if (!$("f-consent").checked) { msg.textContent = "Debes aceptar la política de privacidad."; msg.className = "cuenta-msg err"; return; }

    var fila = { id: form.dataset.uid, email: form.dataset.email || null, consentimiento: true };
    var prefs = Object.assign({}, form._preferencias || {}); // conserva categorías inactivas
    recorrer(function (cat, f) {
      var val = getValor($(campoId(cat, f)), f);
      if (f.store) { fila[f.store] = val; }
      else { (prefs[cat] = prefs[cat] || {})[f.id] = val; }
    });
    fila.preferencias = prefs;

    msg.textContent = "Guardando…"; msg.className = "cuenta-msg";
    sb.from("perfiles").upsert(fila).then(function (res) {
      if (res.error) { msg.textContent = "Error: " + res.error.message; msg.className = "cuenta-msg err"; }
      else { msg.textContent = "✓ Perfil guardado."; msg.className = "cuenta-msg ok"; form._preferencias = prefs; }
    });
  });

  $("logout").addEventListener("click", function () {
    sb.auth.signOut().then(function () { mostrar("login"); });
  });

  // -------- Estado de sesión --------
  function aplicarSesion(session) {
    if (session && session.user) { mostrar("perfil"); cargarPerfil(session.user); }
    else { mostrar("login"); }
  }
  construirFormulario();
  initAvatar();
  sb.auth.getSession().then(function (res) { aplicarSesion(res.data.session); });
  sb.auth.onAuthStateChange(function (_evt, session) { aplicarSesion(session); });
})();
