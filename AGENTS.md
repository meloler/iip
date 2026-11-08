# IIP: entrada para continuar

Lee `docs/PROGRESS.md`, `docs/ROADMAP.md` y `ARCHITECTURE.md` antes de cambiar código. Alcance actual en `docs/PRODUCT.md`; encargo original en `docs/BRIEF.md`. El repositorio es la fuente de verdad.

- Español para producto/documentación; inglés para código. Prioridad: corrección, datos, seguridad, usabilidad.
- `../Módulos` es de solo lectura. Nunca escribir, mover, renombrar o borrar originales. Extracciones privadas solo en `.local/`.
- No publicar, enviar documentos a modelos, crear infraestructura externa, gastar ni operar en brokers sin autorización explícita. No hay remoto Git.
- Datos DEMO siempre identificados; empresas ficticias. Modo real no tiene proveedor y no puede recurrir a DEMO.
- Finanzas deterministas en `server/domain.py`; nunca calcular mediante un modelo de lenguaje. Mantener unidades, FCFF/WACC, ausencia de datos y excepciones sectoriales.
- API autenticada salvo salud/estado/login/setup. Filtrar registros por usuario en servidor. No poner secretos en frontend, Git o logs.
- Verificación: `powershell -ExecutionPolicy Bypass -File scripts/verify.ps1`. Pruebas aisladas; no sembrar usuarios de prueba en `.local/iip.sqlite`.
- Actualizar progreso con evidencia y pendientes. No declarar terminada una fase que solo tiene una parte implementada.
