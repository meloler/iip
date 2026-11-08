# Métodos financieros implementados

## DCF reducido v1

`FCFF_t = FCFF_0 × (1 + crecimiento)^t`

`PV_t = FCFF_t / (1 + WACC)^t`

`TV_N = FCFF_N × (1 + g_terminal) / (WACC - g_terminal)`

`EV = suma(PV_t) + TV_N / (1 + WACC)^N`

`Equity = EV - deuda_neta`; deuda neta = deuda financiera menos efectivo considerado no operativo. La caja neta se expresa con signo negativo. En una empresa real se requerirán ajustes por minoritarios, preferentes, participaciones y otros activos/pasivos no operativos.

`Valor por acción = Equity en M USD / acciones diluidas en M`

`Margen de seguridad = (valor por acción - precio de referencia) / valor por acción`, solo definido si el valor es positivo. No equivale a probabilidad de éxito ni a retorno esperado.

Flujos al final de cada año. Tasas nominales USD, horizonte 1–20 años. FCFF/WACC; FCFE exigiría Ke y no restaría deuda nuevamente. FCFE no se implementa aún. Rechazo de WACC ≤ g, valores no finitos, acciones/precio no positivos y flujo base ≤0. El DCF reducido no se ofrece para empresas financieras. Una empresa con FCF negativo podría valorarse con otro modelo explícito de transición; rechazarla aquí es una limitación de este motor, no una regla financiera universal.

Tres conjuntos de supuestos ilustrativos independientes, editables en UI. Sensibilidad sobre WACC ±1 punto porcentual y g ±0,5 puntos; solo celdas válidas. Los resultados no se redondean internamente a céntimos, solo al presentarlos. Si el terminal supera el 70% del EV se muestra una advertencia descriptiva; no es un umbral de compra.

**Limitaciones:** crecimiento constante de FCFF, sin modelo separado de ventas, márgenes, impuestos, capex o working capital. El FCFF terminal no prueba la reinversión necesaria para sostener g. Ni WACC ni los supuestos vienen de datos reales. No usar para una decisión sobre un emisor real. Contraste conceptual: [CFA Institute](https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/free-cash-flow-valuation) y [Damodaran](https://pages.stern.nyu.edu/~adamodar/New_Home_Page/lectures/val.html).

## Ratios y datos ausentes

PER = precio × acciones / beneficio neto; P/B = capitalización / patrimonio. Resultado N/A cuando el denominador es cero o negativo, o falta un dato. No convertir ausencia en cero. ROIC del DEMO es un supuesto sintético; no se presenta como cálculo con NOPAT/capital invertido. No se han implementado scores, comparables ni normalización sectorial.

## Libro de operaciones

USD únicamente. Compras: coste += cantidad × precio + comisión. Ventas: coste vendido = coste medio antes de venta × cantidad; resultado realizado = precio × cantidad − comisión − coste vendido. Dividendos: importe bruto total − comisión; no modifican coste. Se exige posición abierta en la fecha declarada, sin inferir fecha ex-dividendo. Sin impuestos, FX ni FIFO fiscal. Las cantidades fraccionarias se admiten para instrumentos DEMO; la capacidad real depende del instrumento/broker futuro.

Operaciones ordenadas por fecha, creación e ID y reconstruidas bajo bloqueo de escritura. No se permiten ventas en corto ni operaciones futuras registradas como ejecutadas. El valor de posiciones se calcula contra un snapshot sintético fijo; no se presenta rentabilidad de cartera, TWR/MWR o volatilidad sin la serie adecuada. ETFs/fondos, splits, transferencias, efectivo, correcciones por reversión y delistings quedan pendientes.

## Referencias de prueba independientes

Perpetuidad FCFF=100, crecimiento=0, WACC=10%, g=0: EV=1.000; deuda=200; acciones=10: equity=800; valor=80; precio=60: margen=25%. Compras 10×20+2 y 10×30+2: coste504; vender5×40−1: resultado73 y coste restante378. Especificaciones y pruebas en `tests/test_finance.py`.
