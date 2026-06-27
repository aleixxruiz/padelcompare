# Roadmap — Padel Match

Plan de mejora priorizado. Objetivo: dejar de ser "otro comparador" y ser **la
referencia para elegir pala** (contenido + datos propios → SEO + afiliación).

Estado actual: web **estática** (HTML/CSS/JS en GitHub Pages), 751 palas
scrapeadas con specs e imágenes propias, comparador con filtros, pop-up de
recomendaciones. Sin servidor ni base de datos todavía.

Leyenda: 🟢 encaja con el stack estático actual · 🟠 necesita backend (BD/login)
· 🔵 depende de terceros (alta afiliados / API) · ⚪ aparcado para WordPress/CMS

---

## Fase 1 — Sacar partido al estático (máximo valor, bajo coste)

1. **Fichas de producto con URL propia** (`/pala/<id>`) 🟢
   - Specs completas, imagen grande, descripción.
   - Base para todo lo demás (similares, score, comparativas).
2. **PadelCompare / Padel Match Score** (diferenciador) 🟢
   - Nota global 0-100 a partir de: potencia, control, salida de bola,
     manejabilidad, punto dulce, confort, durabilidad, calidad/precio,
     valoración y tendencia de precio.
   - Muy compartible; difícil de copiar.
3. **Similares + alternativas + % compatibilidad** 🟢
   - "La X se parece un 92% a la Y". Comparar automáticamente con las más
     parecidas / versión anterior / rival directa, sin que el usuario busque.
4. **Comparativas indexables** (`/compare/a-vs-b`) 🟢
   - Pre-generar las combinaciones populares con URL propia.
5. **Comparador inteligente con explicaciones** 🟢→🤖
   - Primero por reglas ("la Vertex da más potencia pero menos manejabilidad");
     con IA real más adelante.

## Fase 2 — Lavado de cara UX/UI premium 🟢

- Badges: **Chollo**, **Nueva**, **Mejor valorada**, **Muy popular**, **Mejor precio**.
- Fotos más grandes, tarjetas más visuales, colores por nivel (verde/azul/rojo).
- **Dark mode**, comparador **sticky**, skeleton loading, animaciones suaves.
- Hero con buscador grande. Sensación "premium", no solo un listado.

## Fase 3 — Datos de precio en el tiempo

6. **Recogida diaria de precios → histórico** 🟢 (con scrape programado)
   - Empezar **cuanto antes** a guardar una foto del precio cada día
     (GitHub Actions cron + JSON en el repo).
   - Gráfico tipo CamelCamelCamel (30/90/365 días) en la ficha.

## Fase 4 — IA 🤖

7. **Asistente IA recomendador** (el Worker ya está hecho en `worker/`)
   - Falta: desplegar el Cloudflare Worker + poner la API key + reactivar el
     botón (descomentar `widget.js` en `index.html`).
   - "No sé qué pala comprar" → pregunta nivel/presupuesto/frecuencia/lesión →
     5 mejores opciones. Botón "Explícame estas dos palas".

## Fase 5 — Afiliación (monetización base) 🔵

8. **Programas de afiliados**: alta en Padel Nuestro, Tradeinn/SmashInn,
   Decathlon, Padel Market, Amazon… (acción del usuario).
9. **Enlaces/feeds reales** por tienda (ya existe `tools/import-feed.mjs`).
   Comparar precios entre tiendas = base de la afiliación.

## Fase 6 — Plataforma / comunidad 🟠 (necesita backend, p. ej. Supabase)

10. **Cuentas de usuario** (perfil: palas favoritas, comparaciones, historial).
11. **Reseñas de usuarios** con valoración por dimensión (potencia, control,
    salida de bola, confort, manejabilidad, durabilidad, calidad/precio) + perfil
    del que opina (nivel, edad, peso, frecuencia, derecha/revés) y filtro:
    "opiniones de intermedios que juegan a la derecha".
12. **Reseñas verificadas** ("Comprada en Tienda X") con insignia.
13. **Wishlist + alertas de precio por email** ("avísame cuando baje de 180€").
14. **Ranking semanal** (más vistas/buscadas/que más bajan/favoritas) y
    **votaciones** ("mejor pala de 2026").

## Fase 7 — Monetización avanzada 🟠🔵

15. **Newsletter** (bajadas de precio, nuevas palas, reviews, comparativas).
16. **Canal de Telegram** solo de ofertas (cada clic = afiliado).
17. **Alertas Premium** (gratis 1 alerta, premium ilimitadas).
18. **Ranking patrocinado** (sin alterar el orden real: banner / destacado / oferta del día).
19. **App** con push cuando baja una pala.

## Aparcado para WordPress/CMS ⚪ (decisión: se hará al migrar)

- **SEO programático**: miles de landings "mejores palas para…"
  (principiantes, <100€, redondas, mujeres, defensivos, revés, dolor de codo,
  carbono, por marca…). Cada combinación = una landing.
- **Guías largas** (4000+ palabras, imágenes, FAQs, vídeos).
- **Noticias / blog** (lanzamientos, ofertas, tecnologías).
- **Páginas "Alternativas a la pala X"**.

---

### Orden recomendado de ejecución
1 → 2 (Fase 1) → UX (Fase 2) → recogida de precios (Fase 3, empezar pronto) →
IA (Fase 4) → afiliados (Fase 5) → backend/comunidad (Fase 6) →
monetización avanzada (Fase 7). SEO/blog al pasar a WordPress.
