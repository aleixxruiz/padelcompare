# Importador de feed de afiliados

Convierte un feed de productos (CSV o XML tipo Google Shopping) en
`datos/productos.js`, que es lo que muestra la web.

## Cómo conseguir el feed
1. Date de alta en un **programa de afiliados** de una tienda de pádel
   (Padel Nuestro, Decathlon… normalmente vía **Awin**, Tradedoubler o CJ).
2. Al aprobarte, te dan acceso a un **feed/catálogo de productos** (CSV o XML).
   Cópiate su **URL** o descarga el **archivo**.

## Uso
```bash
# Necesita Node (ya instalado en ~/.local/node y en el PATH).
node tools/import-feed.mjs --in feed.csv --tienda "Padel Nuestro"
node tools/import-feed.mjs --in https://.../feed.xml --format xml --tienda "Decathlon"
node tools/import-feed.mjs --in feed.csv --limit 500          # tope opcional
node tools/import-feed.mjs --in feed.csv --no-filter          # no filtrar a palas
```
Luego revisa el resultado y publícalo:
```bash
git add datos/productos.js && git commit -m "Actualizar catálogo" && git push
```

## Ajustar el mapeo de columnas
Cada feed nombra sus columnas distinto. Abre `tools/import-feed.mjs` y edita
`FIELD_MAP`: a la izquierda nuestro campo, a la derecha los posibles nombres en
tu feed (cabeceras del CSV o etiquetas del XML). El script usa el primero que
encuentre.

El script **deduce** nivel/estilo/forma/balance del título y la descripción
(no siempre con total precisión) y **filtra** para quedarse solo con palas
(descarta paleteros, zapatillas, grips, etc.); desactiva ese filtro con
`--no-filter`.
