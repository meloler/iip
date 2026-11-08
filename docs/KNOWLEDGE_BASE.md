# Biblioteca y procesamiento documental

197 originales en 11 carpetas: 194 PDF y 3 Excel. Ingesta completa de texto automatizada, no revisión académica completa. Inventario detallado en `.local/inventory.json`/CSV y tabla de continuidad en `INVENTORY.md`. Se conservan nombre, ruta, formato, tamaño, SHA-256, módulo, tema provisional, páginas/hojas, candidatos a métodos/autores/fórmulas, relaciones con módulos del producto y estado de procesamiento.

Pipeline: recorrer sin presuponer extensiones → hash → extracción pypdf por página física con layout → si hay avisos de texto girado, fallback de texto y marca para QA → Excel en modo lectura con referencias por hoja/celda → metadatos y detecciones lexicales → transacción de catálogo/páginas → rebuild FTS5 → inventarios privados. No se evalúan fórmulas ni macros. Se conserva por separado página física PDF de hoja ordinal Excel. El texto de tablas, imágenes y ecuaciones puede estar incompleto aunque la página tenga muchas palabras.

La ingesta reemplaza solo el catálogo derivado, conserva usuarios/operaciones/valoraciones y no escribe en los originales. Reingestar una versión cambia hash y páginas; el control de versiones histórico de documentos todavía no está implementado. Un original cuyo hash cambió se bloquea con HTTP409 hasta reindexar, para no sostener citas obsoletas.

## Recuperación actual

FTS5 con unicode61, eliminación de diacríticos y BM25. Consulta convertida a tokens entrecomillados unidos por OR; no se aceptan operadores FTS del usuario. Página como unidad de recuperación, hasta 12 resultados y 5.000 caracteres por resultado, con enlace protegido al documento y número de página/hoja existente. La UI presenta extractos, no síntesis generada. Coincidencia por palabras no equivale a respuesta correcta. El conjunto completo del curso puede contener opiniones, errores y datos históricos.

Documentos compartidos entre las dos cuentas autorizadas. Credenciales, watchlist y operaciones no entran en el índice. El curso no se copia al build ni al frontend. React renderiza los fragmentos como texto; ninguna instrucción recuperada puede ejecutar herramientas porque no existe tal canal.

## Visor privado

Poppler (`pdftoppm`) renderiza una página bajo demanda a PNG dentro de `.local/rendered/<hash>/`. Tanto el original como la vista requieren sesión y validación del hash/ruta. Paginación por página física y enlaces desde las citas al visor. No depende del soporte PDF nativo del navegador integrado. Caché local derivada, nunca pública; error explícito si falta Poppler. Los archivos de curso permanecen intactos.

## Lotes de revisión siguientes

1. Renta variable y finanzas/riesgo: validar fórmulas, DCF, ROIC, rentabilidades, excepciones y referencias bibliográficas. Priorizar documentos con ecuaciones en imágenes y avisos de extracción.
2. Renta fija y derivados: unidades, duración/convexidad, curvas, opciones y límites de modelos.
3. Conceptos, fiscalidad/private equity y economía: separar contenidos estables de normativa y cifras fechadas; contraste oficial cuando proceda.
4. Inmobiliario, materias primas, geopolítica y cripto: modelos propios, causalidad, referencias y supuestos por clase de activo.

Cada lote debe producir fichas con alcance de lectura, documento/páginas, resumen revisado, fórmulas con unidades, supuestos, limitaciones y contraste. No marcar validado por detectar una palabra. No convertir las etiquetas automáticas en reglas de screening.

RAG futuro: fragmentos por sección con solapamiento y localizadores; embeddings solo tras medir la cobertura lexical; búsqueda híbrida; respuesta con citas comprobadas, abstención y herramientas de cálculo. Evaluación sobre preguntas reales y páginas esperadas, recall@k, citas válidas, soporte de cada afirmación, ausencia de evidencia y ataques en documentos. No hay embeddings, modelo ni coste activado.
