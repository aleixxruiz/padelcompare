/* ============================================================
   Padel Ideal — login (enlace mágico) + perfil de jugador (Supabase)
   ============================================================ */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };

  if (!window.sb) {
    $("estado-config").hidden = false;
    return;
  }
  var sb = window.sb;

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
    msg.textContent = "Enviando…";
    sb.auth.signInWithOtp({
      email: email,
      options: { emailRedirectTo: location.origin + location.pathname },
    }).then(function (res) {
      if (res.error) { msg.textContent = "Error: " + res.error.message; msg.className = "cuenta-msg err"; }
      else { msg.textContent = "✓ Revisa tu correo y pulsa el enlace para entrar."; msg.className = "cuenta-msg ok"; }
    });
  });

  // -------- Cargar / guardar perfil --------
  function cargarPerfil(user) {
    $("perfil-form").dataset.uid = user.id;
    $("perfil-form").dataset.email = user.email || "";
    sb.from("perfiles").select("*").eq("id", user.id).maybeSingle().then(function (res) {
      var p = res.data;
      if (p) {
        $("f-nombre").value = p.nombre || "";
        $("f-playtomic").value = p.nivel_playtomic != null ? p.nivel_playtomic : "";
        $("f-estilo").value = p.estilo || "indiferente";
        $("f-mano").value = p.mano || "";
        $("f-frecuencia").value = p.frecuencia || "";
        $("f-presupuesto").value = p.presupuesto != null ? p.presupuesto : "";
        $("f-peso").value = p.peso != null ? p.peso : "";
        $("f-codo").checked = !!p.lesion_codo;
        $("f-consent").checked = !!p.consentimiento;
      } else if (user.user_metadata && user.user_metadata.full_name) {
        $("f-nombre").value = user.user_metadata.full_name;
      }
    });
  }

  $("perfil-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var uid = $("perfil-form").dataset.uid;
    var msg = $("perfil-msg");
    if (!$("f-consent").checked) { msg.textContent = "Debes aceptar la política de privacidad."; msg.className = "cuenta-msg err"; return; }
    var num = function (v) { return v === "" ? null : Number(v); };
    var fila = {
      id: uid,
      email: $("perfil-form").dataset.email || null,
      nombre: $("f-nombre").value.trim() || null,
      nivel_playtomic: num($("f-playtomic").value),
      estilo: $("f-estilo").value || null,
      mano: $("f-mano").value || null,
      frecuencia: $("f-frecuencia").value || null,
      presupuesto: num($("f-presupuesto").value),
      peso: num($("f-peso").value),
      lesion_codo: $("f-codo").checked,
      consentimiento: $("f-consent").checked,
    };
    msg.textContent = "Guardando…"; msg.className = "cuenta-msg";
    sb.from("perfiles").upsert(fila).then(function (res) {
      if (res.error) { msg.textContent = "Error: " + res.error.message; msg.className = "cuenta-msg err"; }
      else { msg.textContent = "✓ Perfil guardado."; msg.className = "cuenta-msg ok"; }
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
  sb.auth.getSession().then(function (res) { aplicarSesion(res.data.session); });
  sb.auth.onAuthStateChange(function (_evt, session) { aplicarSesion(session); });
})();
