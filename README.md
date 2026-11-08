# Investment Intelligence Platform · IIP

Base local y privada para investigar inversiones. Primer hito funcional con empresas ficticias, DCF determinista, watchlist, libro DEMO y biblioteca del curso con fuentes por página. No es todavía el producto completo ni está desplegado.

## Abrir en este equipo

```powershell
cd 'C:\Users\Usuario\Downloads\IIP'
.\scripts\start.ps1
```

Abre [IIP local](http://127.0.0.1:8765). Crea tu primera cuenta desde la pantalla inicial (contraseña de al menos 12 caracteres). No hay credenciales predeterminadas. Desde Configuración puedes crear la segunda cuenta. Ambas comparten el curso; carteras, watchlist y valoraciones se separan en el servidor.

Si PowerShell bloquea los scripts, usa `powershell -ExecutionPolicy Bypass -File scripts/start.ps1`; este ajuste corresponde solo a ese proceso. Detén el servidor con Ctrl+C. El servidor escucha exclusivamente en loopback.

## Preparar desde cero

Requisitos: Python 3.12+, uv, npm, Node 22.13+ (preferible Node 24 LTS) y Poppler (`pdftoppm`) en PATH para el visor. `scripts/npm.ps1` usa el Node compatible del runtime local de Codex cuando el Node del sistema es antiguo. No instala ni actualiza herramientas globales. El visor renderiza páginas localmente y conserva acceso al PDF original; si falta Poppler muestra un error explícito.

```powershell
uv sync --locked
.\scripts\npm.ps1 ci
uv run python scripts/ingest.py 'C:\Users\Usuario\Downloads\Módulos'
.\scripts\npm.ps1 run build
.\scripts\start.ps1
```

La ingesta lee los originales y escribe SQLite, el inventario JSON/CSV y el resumen en `.local/`, excluido de Git. Puede tardar alrededor de un minuto según el equipo. Para comprobar originales y generar el inventario de continuidad: `uv run python scripts/audit_catalog.py`.

Para desarrollar la UI, `scripts/npm.ps1 run dev` sirve Vite; la API debe estar activa en 8765. Las mutaciones requieren mismo origen: en esta versión usa el build servido por FastAPI para los flujos completos. No configures escucha remota.

## Qué probar

1. Screener: buscar `ASTD`, abrir Aster Systems y revisar Datos y procedencia.
2. Vista ejecutiva: revisar supuestos, calcular escenario Base y guardar. Valores iniciales: 108,80 USD/acción y margen de seguridad 22,3%, **todos DEMO**.
3. Añadir a seguimiento. En Cartera registrar compra de 2,5 acciones a 80 USD con comisión de 1 USD el 31/12/2025: coste 201 USD, valor snapshot 211,25 USD y resultado no realizado 10,25 USD.
4. Asistente: buscar `WACC`, abrir la página original desde una fuente. Es recuperación textual, sin respuesta generativa.
5. Biblioteca: filtrar por título/módulo, abrir PDF o descargar Excel protegido.

El libro admite compras, ventas y dividendos, con coste medio. Los precios son un snapshot sintético del 31/12/2025, no cotizaciones actuales. No calcula efectivo, impuestos, FX, TWR/MWR ni negocia activos.

## Verificar y continuar

```powershell
.\scripts\verify.ps1
```

Ejecuta lint Python/React, pruebas, tipado, build y límites entre módulos. `uv run pytest -q` usa directorios temporales y no toca cuentas ni movimientos del usuario. La prueba de navegador se realizó en `.local/browser-qa`, con cuenta y operaciones de prueba separadas del espacio principal.

- [Estado real](docs/PROGRESS.md), [roadmap](docs/ROADMAP.md), [arquitectura](ARCHITECTURE.md).
- [Inventario de los 197 archivos](docs/INVENTORY.md), [mapa de métodos](docs/KNOWLEDGE_MAP.md), [revisión del curso](docs/COURSE_REVIEW.md).
- [Fuentes evaluadas](docs/DATA_SOURCES.md), [métodos financieros](docs/FINANCIAL_METHODS.md), [seguridad](docs/SECURITY.md).

Sin APIs de pago, IA externa, automatizaciones activas, brokers, infraestructura remota ni publicación. Para uso remoto se necesita una revisión y un despliegue autorizado.
