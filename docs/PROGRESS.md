# Estado real · 8 de noviembre de 2026

## Resultado entregado

Repositorio local independiente en `C:\Users\Usuario\Downloads\IIP`, sin remoto ni publicación. Curso original de `../Módulos` intacto. Aplicación arrancada y verificada en `http://127.0.0.1:8765`, con pantalla de creación de la primera cuenta. **No hay usuarios ni operaciones de prueba en la base principal.** La prueba de navegador usa `.local/browser-qa` y otro puerto, que se detiene al terminar.

Stack decidido tras inspección: monolito React19/TypeScript/Vite + FastAPI/Pydantic + SQLite/FTS5; Python3.12. Dependencias fijadas por locks. Next.js y PostgreSQL evaluados; SSR no es necesario para este primer espacio privado y no se aprovisiona infraestructura. Decisiones en DECISIONS y ARCHITECTURE.

## Qué funciona

- Autenticación local, sesiones de 12 h y dos cuentas con watchlist/valoraciones/libro privados. Biblioteca compartida entre esas cuentas.
- Dashboard, búsqueda/filtros/ordenación de cuatro compañías ficticias, ficha de datos con procedencia, estados ausentes y exportación CSV DEMO.
- DCF FCFF/WACC simplificado, tres juegos de supuestos editables, flujos descontados, terminal/EV/equity/acción/margen y sensibilidad de 9 celdas cuando son válidas. Persistencia de hipótesis y resultados. No aplicable a bancos/FCFF base negativo.
- Watchlist persistente. Compras, ventas y dividendos DEMO en USD, fracciones, comisiones, coste medio, posiciones y resultados. Rechazo de operaciones futuras y ventas sin acciones, incluidas retroactivas.
- Catálogo completo, filtro tolerante a acentos/Unicode, búsqueda de contenido por FTS5 y referencias por página/hoja. Visor protegido con paginación y render local Poppler; original siempre accesible. Las citas abren la página correspondiente en el visor.
- Modo claro/oscuro y navegación móvil. Market Intelligence y asistente generativo muestran su alcance pendiente; el asistente actual recupera evidencia textual sin sintetizar.

## Auditoría documental

197 archivos en 11 módulos:194 PDF y 3 Excel. 2.663 páginas PDF y 10 hojas Excel, 2.673 registros de localización.197 archivos con extracción terminada, **todos pendientes de QA académica integral**. Dos duplicados exactos identificados por SHA-256 (exámenes de renta variable y renta fija).

La primera extracción tenía 348 páginas con poco texto. La extracción con layout y fallback deja **294páginas con menos de 80 caracteres**. Tres documentos tienen 12 páginas con avisos de layout/texto girado y extracción alternativa registrada. Una página con mucho texto también puede omitir fórmulas en imágenes. No hay OCR ejecutado ni garantía de tablas perfectas.

Revisados textualmente el documento DCF de 23 páginas y la introducción a value de 5 páginas; QA visual del DCF en 4, 19 y 20. Opiniones/rangos del curso y errores de figura/etiqueta registrados en COURSE_REVIEW. No se ha validado toda la bibliografía ni cifras históricas. Inventario y mapa automatizados en INVENTORY y KNOWLEDGE_MAP; JSON/CSV privado más detallado en `.local/`.

## Evidencia ejecutada

| Comprobación | Resultado |
|---|---|
| `uv run ruff check server scripts tests` | Correcto |
| `uv run pytest -q` | **21 pruebas superadas**; un aviso de deprecación de Starlette sobre el cliente httpx de pruebas, sin fallos |
| ESLint React, reglas de hooks | Correcto |
| TypeScript y build Vite | Correcto; JS aproximado de 277 kB, gzip de 86 kB, sin recursos externos |
| Formato Prettier y ruff | Aplicado; comprobación Prettier correcta |
| Límites de dominio/proveedor y frontend | Correcto |
| `npm audit` tras resolver minimatch | **0 vulnerabilidades conocidas**. Override minimatch 11.0.1 verificado con lint/build; revisar al actualizar dependencias |
| Catálogo/originales | **197/197 hashes coinciden**,197 documentos,2.673 localizadores;12 fragmentos WACC corresponden a las páginas de SQLite |
| Navegador → API → SQLite → UI | Login de fixture, screener ASTD, DCF 108,80 USD, guardar, watchlist, compra 2,5 × 80 + 1; cartera valor 211,25 / coste 201 / resultado 10,25 USD |
| Biblioteca en navegador | Consulta WACC y enlace abre página 13/23; página 19 renderizada a 1133 × 1600 con fórmula visible. Cierre de diálogo con Escape |
| Responsive | Escritorio 1440 × 1000 y móvil 390 × 844; modo claro/oscuro, abrir/cerrar menú. Ancho de contenido 375 = viewport 375 descontando scrollbar; sin desbordamiento horizontal |
| Consola al finalizar QA | Sin errores ni warnings JavaScript capturados |
| Arranque | `scripts/start.ps1` inicia Uvicorn en 127.0.0.1:8765; pantalla inicial de cuenta observada |

Evidencia local excluida de Git: `.local/verification.txt`, `.local/catalog-verification.json`, `.local/ingest-summary.json`, `.local/proofs/iip-ready.jpg` y renders de QA. La captura de inicio muestra la base principal lista para crear la cuenta; el flujo financiero se probó en el espacio DEMO aislado.

## Incidencias corregidas durante el hito

Codificación de consola Windows; inserción de catálogo con número incorrecto de parámetros; líneas fragmentadas en extracción; texto girado; import CSS vacío; cadena de cierre JSX; paso de flags desde PowerShell a npm; avisos de serialización Decimal; dependencias de lint desactualizadas/vulnerables; búsquedas con acentos descompuestos; visor PDF nativo gris en IAB; foco/modal, enlace de salto y navegación móvil. Los fallos se corrigieron antes de declarar verificado el flujo. Ninguna incidencia exigió cambiar los originales.

## Lo que falta

No hay proveedor financiero real, screening global, histórico fundamental ni precios actuales. No hay IA/embeddings, resúmenes académicos validados, mapas interactivos, tesis/versiones, técnico, scores, FX, efectivo, TWR/MWR, riesgo estadístico, ETF/fondos, alertas, noticias, informes programados, backup/restauración automatizados ni despliegue. Los estados reales no sustituyen errores con cifras DEMO.

Este resultado completa discovery sistemático y una primera implementación local. Las fases 0B, 2B y 3 siguen parciales/pendientes según ROADMAP; no se considera terminada la plataforma completa ni preparada para producción.

## Próximo trabajo

Revisión por lotes de renta variable/finanzas/riesgo y pruebas de contrato de un importador SEC de solo lectura. Acordar mercado inicial, cobertura y licencia antes de integrar precios reales. La autorización de trabajo local persiste; contratar, transmitir documentos a una IA o desplegar requiere decisión explícita. No hay bloqueo material para seguir con desarrollo local y fixtures.
