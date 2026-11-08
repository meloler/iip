# Arquitectura y límites

## Ejecución actual

Navegador React/TypeScript → API FastAPI autenticada → servicios de dominio y repositorios SQLite. FastAPI sirve el build Vite desde `dist/` en el mismo origen. Un proceso, un fichero SQLite, sin llamadas de datos a terceros. Documentos originales fuera del repositorio y abiertos mediante una ruta protegida que comprueba identidad, contención de ruta y SHA-256.

| Capa | Archivos | Responsabilidad |
|---|---|---|
| Presentación | `frontend/` | Formularios, tablas, navegación por hash, estados, visualización; sin cálculos financieros sustantivos |
| API | `server/app.py` | Contratos Pydantic de entrada, autorización, errores, orquestación |
| Identidad | `server/auth.py` | Hash de contraseña, sesiones opacas, resolución de usuario |
| Dominio | `server/domain.py` | DCF, ratios, libro de posiciones; sin I/O, FastAPI ni proveedores |
| Proveedores | `server/providers.py` | Modelo canónico; adaptadores DEMO y no configurado |
| Conocimiento | `server/knowledge.py`, `scripts/ingest.py` | Extracción por página, catálogo y FTS5 |
| Persistencia | `server/db.py`, `migrations/` | Conexiones, transacciones, migraciones SQL versionadas |

`scripts/check_boundaries.py` impide dependencias de dominio/proveedor hacia API o persistencia y detecta ciertas referencias directas a proveedores/claves en frontend. No sustituye una revisión arquitectónica. React consulta endpoints internos mediante `frontend/lib.ts`, con tipos de respuesta en `frontend/types.ts`. OpenAPI autenticado en `/api/openapi.json`. Generación automática de tipos de respuesta y modularización adicional de rutas quedan pendientes cuando crezca la API.

## Modelo de datos

- `users` 1:N `sessions`, `watchlist`, `trades`, `valuations`. Cada consulta privada se filtra por `user_id` resuelto desde sesión, nunca desde la petición.
- `documents` 1:N `pages`; `pages_fts` indexa el texto por localizador. SHA-256 por versión de archivo. `settings.course_root` solo se escribe mediante la ingesta local.
- Watchlist única por usuario/empresa. Operaciones inmutables en esta UI; reconstrucción cronológica dentro de una transacción para impedir ventas sin posición, incluso con fechas retroactivas. Importes y cantidades como cadenas Decimal.
- Valoración guarda hipótesis, resultado, instante y versión del método. No es todavía un motor de tesis ni una gestión de revisiones financieras.
- El proveedor retorna empresa/instrumento, bolsa, divisa, sector, período, publicación, actualización, origen, unidad, estado y tipo de cada observación. La implementación real deberá añadir validación contractual, revisiones point-in-time, períodos fiscales, splits y cobertura.

## Evolución prevista

Separar routers/servicios cuando existan más casos de uso, manteniendo el dominio independiente. Migrar repositorios a PostgreSQL antes de ofrecer acceso remoto multiinstancia. Añadir membresías de carteras compartidas de forma explícita. Un worker simple solo cuando haya trabajos lentos reales. Búsqueda híbrida solo después de evaluar recuperación lexical y autorizar embeddings. Las fases posteriores no están activas por haber sido diseñadas.
