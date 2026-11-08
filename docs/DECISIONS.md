# Decisiones, 8 de noviembre de 2026

## ADR-001 · Desarrollo local y protección del curso
No existía código ni Git. Los 197 originales de `../Módulos` son de solo lectura. Este repositorio separado contiene código y documentación; `.local/` contiene SQLite, extracciones e inventario privado y queda excluido de Git. Sin remoto, publicación, gasto ni credenciales externas.

## ADR-002 · Monolito modular
React + TypeScript + Vite para una interfaz privada sin SEO; FastAPI + Pydantic para validación/OpenAPI y Python para documentos/cálculos. Un proceso FastAPI sirve el build y la API en el mismo origen. Se evaluó Next.js: es válido, pero su SSR no aporta una necesidad actual y añadiría un segundo entorno backend para procesamiento documental. CSS con variables y SVG accesible evita dependencias de gráficos innecesarias.

SQLite con migraciones SQL, claves foráneas y FTS5 permite dos usuarios locales sin aprovisionar servicios. PostgreSQL será la opción para despliegue concurrente/remoto. Migrar requerirá adaptar repositorios, SQL y búsqueda; no se promete migración automática. No se necesita pgvector, una cola ni microservicios para el primer hito.

## ADR-003 · Datos y búsqueda
Solo proveedor sintético en la primera implementación, con empresas ficticias y marca DEMO persistente. Modo real sin proveedor produce datos no disponibles, nunca fallback silencioso. Búsqueda documental lexical por página con FTS5 y referencias exactas; no se presenta como búsqueda semántica ni como respuestas generadas por IA. Embeddings y modelos se elegirán después de medir calidad y autorizar sus costes/transmisión de documentos privados.

## ADR-004 · Alcance inicial
Fundamentos + primer flujo reducido: autenticación local para dos cuentas, búsqueda de empresas ficticias, ficha, DCF FCFF editable, watchlist, libro manual de operaciones DEMO y biblioteca con búsqueda y originales protegidos. Market Intelligence, scores, noticias, modelos sectoriales y asistente generativo permanecen pendientes y se identifican como tales en la UI.

## ADR-005 · Finanzas
Decimal en dominio y almacenamiento textual para importes. DCF FCFF con WACC, g perpetuo y puente deuda neta, todo en millones de USD y millones de acciones; cotización en USD/acción. No se deriva FCFF del CFO menos CapEx sin ajustar financiación. Libro de posiciones con coste medio ponderado, comisiones y dividendos; sin TWR/MWR ni rentabilidad anualizada mientras falten valoraciones y flujos completos.
