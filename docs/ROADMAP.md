# Roadmap y criterios de salida

El orden sigue dependencias de datos y riesgo. No hay calendario artificial ni promesa de screening global gratuito.

| Hito | Estado | Criterio de salida / siguiente trabajo |
|---|---|---|
| 0A Discovery sistemático | Implementado | Entorno inspeccionado, 197 archivos inventariados/extraídos, hashes y localizadores verificados, fuentes/arquitectura/MVP documentados |
| 0B Auditoría académica | Parcial | Dos documentos prioritarios revisados textualmente; lote completo requiere validación de fórmulas, imágenes, autores y contrastes. No basta extracción |
| 1 Fundamentos | Implementación local | Arranque, sesión para dos usuarios, diseño claro/oscuro, navegación real, migración, build y controles. Verificación actual en PROGRESS |
| 2A Flujo DEMO | Implementado con límites | Empresa→datos→DCF→watchlist→operación→cartera→evidencia. Persistencia y aislamiento probados. Consulta final lexical, sin IA |
| 2B Flujo con datos reales | Pendiente | Elegir mercado inicial/proveedor y licencia; importar fuente primaria y precios; contratos de cobertura, fechas y ausencia de datos; contrastes independientes |
| 3 Biblioteca inteligente | Parcial | Revisar extracción/OCR, versiones, fichas académicas, mapas interactivos y evaluación de recuperación. Embeddings/modelos solo con decisión de privacidad/coste |
| 4 Screener avanzado | Pendiente | Universo real, filtros/estrategias editables y umbrales justificados; normalización, scores auditables, excepciones sectoriales, comparación/vistas |
| 5 Research avanzado | Pendiente | Drivers financieros, estados históricos, FCFF/FCFE coherentes, modelos sectoriales/complementarios, tesis/versiones, técnico y exportación |
| 6 Portfolio avanzado | Pendiente | Efectivo, FX, impuestos, corporate actions, fondos/ETF, series y TWR/MWR, riesgo con suficiencia estadística, recurrentes diferenciados de ejecutados |
| 7 Market Intelligence | Pendiente | Noticias/SEC/macro/Polymarket de lectura, eventos vinculados a cartera/watchlist; informes y alertas con scheduler configurado y probado |
| 8 Endurecimiento/despliegue | Pendiente | Revisión de seguridad/accesibilidad, rendimiento, backups/restauración, observabilidad, costes y aprobación expresa de infraestructura/despliegue |

## Próxima ejecución recomendada

Completar el lote documental de renta variable/gestión del riesgo y diseñar un importador SEC de solo lectura con fixtures y cobertura explícita. Puede desarrollarse sin contratar servicios. Antes de conectar una API con identificación/contacto o claves: decidir mercado y permisos. Mantener DEMO como entorno reproducible y real como espacio separado. La extracción íntegra ya existe; no repetirla salvo cambios del extractor/origen o fallos relevantes.
