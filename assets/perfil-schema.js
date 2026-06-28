/* ============================================================
   Esquema del formulario de perfil (modular por categoría).
   - "comunes": preguntas para todo el pádel (se guardan en columnas).
   - "categorias": cada una con sus preguntas y un flag "activa".
       · Si un campo tiene "store", se guarda en esa columna de la tabla.
       · Si no, se guarda en preferencias[categoria][campo] (JSONB).
   Para activar una categoría cuando tengas sus productos: pon activa: true.
   ============================================================ */
window.PERFIL_SCHEMA = {
  comunes: [
    { id: "nombre", store: "nombre", label: "Nombre completo", tipo: "text", ph: "Tu nombre", autocomplete: "name" },
    { id: "nivel_playtomic", store: "nivel_playtomic", label: "Nivel Playtomic (0 – 7)", tipo: "number", min: 0, max: 7, step: 0.25, ph: "Ej. 3.5" },
    { id: "mano", store: "mano", label: "Mano / lado", tipo: "select", opciones: [["", "—"], ["derecha", "Juego en la derecha"], ["reves", "Juego en el revés"], ["ambidiestro", "Indistinto"]] },
    { id: "frecuencia", store: "frecuencia", label: "Frecuencia de juego", tipo: "select", opciones: [["", "—"], ["ocasional", "Ocasional"], ["1-2 semana", "1-2 veces / semana"], ["3+ semana", "3 o más / semana"]] },
    { id: "donde_juega", store: "donde_juega", label: "¿Dónde juegas?", tipo: "select", opciones: [["", "—"], ["indoor", "Indoor (cubierta)"], ["outdoor", "Outdoor (exterior)"], ["ambas", "Ambas"]] },
    { id: "presupuesto", store: "presupuesto", label: "Presupuesto máximo (€)", tipo: "number", min: 0, step: 10, ph: "Ej. 200" },
  ],
  categorias: [
    {
      key: "palas", label: "Palas", icon: "🎾", activa: true,
      campos: [
        { id: "estilo", store: "estilo", label: "Estilo de juego", tipo: "select", opciones: [["indiferente", "Indiferente"], ["control", "Control"], ["potencia", "Potencia"], ["polivalente", "Polivalente"]] },
        { id: "peso", store: "peso", label: "Tu peso (kg, opcional)", tipo: "number", min: 30, max: 180, ph: "Opcional" },
        { id: "lesion_codo", store: "lesion_codo", label: "He tenido molestias de codo (epicondilitis)", tipo: "check" },
      ],
    },
    {
      key: "zapatillas", label: "Zapatillas", icon: "👟", activa: false,
      campos: [
        { id: "talla_pie", label: "Talla de pie (EU)", tipo: "number", min: 30, max: 50, ph: "Ej. 42" },
        { id: "tipo_pista", label: "Superficie habitual", tipo: "select", opciones: [["", "—"], ["indoor", "Indoor"], ["outdoor", "Outdoor"], ["ambas", "Ambas"]] },
        { id: "pisada", label: "Tipo de pisada", tipo: "select", opciones: [["", "No lo sé"], ["neutra", "Neutra"], ["pronadora", "Pronadora"], ["supinadora", "Supinadora"]] },
      ],
    },
    {
      key: "ropa", label: "Ropa", icon: "👕", activa: false,
      campos: [
        { id: "talla", label: "Talla", tipo: "select", opciones: [["", "—"], ["XS", "XS"], ["S", "S"], ["M", "M"], ["L", "L"], ["XL", "XL"], ["XXL", "XXL"]] },
        { id: "clima", label: "¿Cómo sueles jugar?", tipo: "select", opciones: [["", "—"], ["frio", "Con frío"], ["templado", "Templado"], ["calor", "Con calor"]] },
      ],
    },
  ],
};
