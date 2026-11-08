# Pruebas y evidencia

`scripts/verify.ps1` es el punto de entrada: ruff → pytest → ESLint → TypeScript/build Vite → límites entre módulos. Dependencias reproducibles mediante `uv.lock` y `package-lock.json`. Datos y cuentas de pruebas aislados con directorios temporales.

## Cobertura del hito

- Referencias financieras independientes: perpetuidad, valor terminal/EV/equity/acción/margen, descuento anual, caja neta, equity negativo y entradas no finitas/inválidas.
- Libro: coste medio, compras/ventas/dividendos/comisiones, fracciones, cierre total, falta de cotización, rechazo de venta sin posición y FX no soportado.
- API: flujo vertical, persistencia, datos sintéticos explícitos, modelo bancario no aplicable, fechas futuras, ventas retroactivas sin posición y modo real sin fallback.
- Identidad: lectura anónima rechazada, origen/cabecera/host, límite de usuarios, rate limit de login, cookies, expiración/cierre e independencia entre dos usuarios.
- Documentación: localizadores existentes, hash cambiado bloqueado, original protegido, consultas FTS maliciosas como datos y contenido de inyección devuelto sin ejecutar. Esto verifica ausencia del canal de ejecución actual, no la robustez de un modelo futuro.
- Ingesta: idempotencia, huellas de originales intactas, hojas/celdas/fórmulas sin evaluar y detección de página sin texto. Originales del usuario jamás se modifican en pruebas.
- Catálogo real: `scripts/audit_catalog.py` contrasta los197 hashes, recuentos y correspondencia de los fragmentos WACC con sus páginas.

## Prueba manual de navegador reproducible

Base separada `.local/browser-qa` creada con `scripts/prepare_browser_qa.py` solo a partir de una base sin usuarios. El script se niega a sobrescribir una base existente. Cuenta de fixture exclusiva para QA; no se crea en el espacio normal ni se entrega como credencial de uso real.

Login de fixture → screenerASTD → ficha → DCF base → guardar → watchlist → compra2,5×80+1 → cartera211,25/coste201/resultado10,25 → buscarWACC y comprobar documento/página → biblioteca/visor. Revisar consola, sesión, navegación, modo claro y viewport móvil. Evidencia y resultados de ejecución en PROGRESS; no se afirma end-to-end automatizado con Playwright instalado.

## Lo que no se ha probado ni implementado

Contratos de un proveedor real, XBRL/TTM, revisiones fiscales/contables, splits/delistings, FX real, retornos TWR/MWR, correlaciones, RAG generativo, schedulers, recuperación de backup, producción o certificación WCAG. Los casos fuera del dominio actual deben rechazarse o mostrarse pendientes, no pasar mediante números inventados.
