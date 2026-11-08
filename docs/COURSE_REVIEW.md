# Revisión académica inicial: alcance y observaciones

Revisión del 8 de noviembre de 2026. Se ha extraído texto de todos los archivos, pero **no se ha leído ni validado académicamente todo el curso**. El inventario usa etiquetas provisionales. Este registro documenta la lectura de dos textos prioritarios y la revisión visual de páginas concretas del DCF. No se han validado las afirmaciones históricas ni las citas de autores contra sus obras originales.

## Valoración por Descuento de Flujos de Caja (DFC)

ID `4cf123d7abc14ceae158`, 23 páginas físicas. Se revisó el texto y se renderizaron las páginas4,19,20 para inspeccionar fórmulas que la extracción textual omite. Ruta completa/localizadores en inventario y biblioteca.

- Páginas2–3 y13–14: distingue FCFF/WACC de FCFE/Ke, y puente EV a equity. Es la separación utilizada en el motor. El curso también recomienda FCFF de forma general y en otro pasaje expresa preferencia personal por FCFE: son elecciones del autor, no reglas universales.
- Páginas4–7: pesos deuda/equity, coste de deuda y efecto fiscal. La fórmula visual es correcta en forma. La explicación puede inducir a usar patrimonio contable; en valoración deben justificarse pesos de mercado/objetivo, coste marginal de deuda y disponibilidad del escudo fiscal. No extrapolar una tasa fiscal mencionada a otro país o fecha.
- Páginas9–13: usa un tipo libre de riesgo fechado, retorno de mercado del8% y preferencia por beta1/Ke8% para empresas occidentales. Son ejemplos/opiniones, no parámetros vigentes universales. Moneda, duración, prima de mercado, riesgo país y negocio deben ser coherentes con cada valoración. Un WACC bajo no demuestra por sí solo buena asignación de capital.
- Página19: ecuación visual TV=FCF_(n+1)/(r−g), ejemplo235×1,02/0,06=3995 M EUR. Cálculo coherente con r8% y g2%.
- Página20: la figura de descuento del terminal muestra **100** en el numerador aunque el resultado1.850 corresponde aproximadamente a descontar3.995 durante10años al8%. Es una inconsistencia del gráfico. El párrafo final llama valor terminal a2.856 M EUR, cuando la suma presentada es enterprise value. El motor mantiene ambas magnitudes separadas y usa pruebas independientes.
- Páginas20–23: sensibilidad, predominio del terminal, incertidumbre y flujos negativos. Su tratamiento requiere un modelo de transición documentado. El hito inicial solo admite FCFF base positivo y no reproduce como reglas los rangos de tasas del texto.

Contraste de método: [CFA Institute: FCFF y FCFE](https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/free-cash-flow-valuation), [material docente original de Damodaran](https://pages.stern.nyu.edu/~adamodar/New_Home_Page/lectures/val.html). Este contraste respalda la separación de flujos y tasas, no valida cada afirmación del curso.

## Introducción, ventajas y desventajas del value investing

ID `81d1b9f21dba89ec851f`, texto de las5páginas revisado. Autores nombrados: Graham, Dodd, Munger y Lynch; las atribuciones textuales necesitan contraste bibliográfico antes de usarlas como citas verificadas.

- Páginas1–3: análisis del negocio, incertidumbre, margen de seguridad y círculo de competencia. Se relaciona con los supuestos explícitos y preguntas pendientes de Research; el margen mostrado en IIP no es una garantía.
- Página2: admite enfoques diversos y el crecimiento como parte del valor. La plataforma mantiene estrategias independientes y no opone automáticamente growth a value.
- Página5: la posible menor volatilidad de carteras value no se adopta como hecho universal ni como riesgo garantizado menor; exige universo, período y evidencia. Los ejemplos empresariales e históricos del texto no alimentan el proveedor de datos.

## Límite del mapa actual

Los métodos detectados por regex y las fórmulas con signo igual son candidatos. No cubren ecuaciones en imágenes, símbolos fragmentados, sinónimos ni bibliografías completas. Las páginas con mucho texto pueden seguir omitiendo fórmulas. Priorizar QA visual antes de automatizar reglas de selección.
