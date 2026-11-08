"""Deterministic finance. No network, UI, storage, or model dependencies."""

from decimal import Decimal, localcontext

from pydantic import BaseModel, ConfigDict, Field, model_validator

D = Decimal


class DCFInputs(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)
    fcff: Decimal = Field(gt=0, le=1_000_000_000, description="Base FCFF in millions of USD")
    growth: Decimal = Field(ge=D("-0.5"), le=D("0.5"))
    wacc: Decimal = Field(gt=0, le=D("0.5"))
    terminal_growth: Decimal = Field(ge=D("-0.05"), le=D("0.08"))
    net_debt: Decimal = Field(ge=-1_000_000_000, le=1_000_000_000)
    shares: Decimal = Field(gt=0, le=1_000_000_000, description="Millions of diluted shares")
    price: Decimal = Field(gt=0, le=1_000_000_000)
    years: int = Field(default=5, ge=1, le=20)

    @model_validator(mode="after")
    def valid_terminal(self):
        if self.wacc <= self.terminal_growth:
            raise ValueError("WACC debe ser mayor que el crecimiento perpetuo")
        return self


def dcf(inputs: DCFInputs) -> dict:
    with localcontext() as context:
        context.prec = 32
        cashflow = inputs.fcff
        projections = []
        for year in range(1, inputs.years + 1):
            cashflow *= 1 + inputs.growth
            present = cashflow / (1 + inputs.wacc) ** year
            projections.append({"year": year, "fcff": str(cashflow), "present_value": str(present)})
        terminal = cashflow * (1 + inputs.terminal_growth) / (inputs.wacc - inputs.terminal_growth)
        pv_terminal = terminal / (1 + inputs.wacc) ** inputs.years
        enterprise = sum(D(x["present_value"]) for x in projections) + pv_terminal
        equity = enterprise - inputs.net_debt
        value = equity / inputs.shares
        margin = (value - inputs.price) / value if value > 0 else None
        warnings = [
            "Proyección simplificada de FCFF: crecimiento constante; reinversión y márgenes no modelados por separado.",
            "Hipótesis nominales en USD. Sin probabilidad asignada ni recomendación de compra.",
        ]
        if equity <= 0:
            warnings.append("Equity no positivo: margen de seguridad no definido.")
        if pv_terminal / enterprise > D("0.7"):
            warnings.append("Más del 70% del valor empresarial depende del valor terminal.")
        return {
            "method_version": "fcff-constant-growth-v1",
            "currency": "USD",
            "unit": "millions (except per-share)",
            "projections": projections,
            "terminal_value": str(terminal),
            "pv_terminal": str(pv_terminal),
            "enterprise_value": str(enterprise),
            "equity_value": str(equity),
            "value_per_share": str(value),
            "margin_of_safety": str(margin) if margin is not None else None,
            "terminal_share": str(pv_terminal / enterprise),
            "warnings": warnings,
        }


def ratio(numerator: Decimal | None, denominator: Decimal | None, positive_denominator=True):
    if numerator is None or denominator is None or denominator == 0:
        return None
    if positive_denominator and denominator < 0:
        return None
    return str(numerator / denominator)


def ledger(trades: list[dict], prices: dict[str, str]) -> dict:
    positions = {}
    realized = D(0)
    dividends = D(0)
    for trade in trades:
        key = trade["company_id"]
        position = positions.setdefault(key, {"quantity": D(0), "cost": D(0)})
        quantity, price, fees = (D(str(trade[k])) for k in ("quantity", "price", "fees"))
        if trade["currency"] != "USD":
            raise ValueError("Este hito admite solo USD; no hay conversión FX implícita")
        if trade["kind"] == "BUY":
            position["quantity"] += quantity
            position["cost"] += quantity * price + fees
        elif trade["kind"] == "SELL":
            if quantity > position["quantity"]:
                raise ValueError("La venta excede las acciones disponibles en esa fecha")
            cost_sold = position["cost"] * quantity / position["quantity"]
            realized += quantity * price - fees - cost_sold
            position["cost"] -= cost_sold
            position["quantity"] -= quantity
        elif trade["kind"] == "DIVIDEND":
            if position["quantity"] <= 0:
                raise ValueError("El dividendo requiere una posición abierta en esa fecha")
            dividends += price - fees
    output = []
    for company, position in positions.items():
        if position["quantity"] > 0:
            quote = prices.get(company)
            value = position["quantity"] * D(quote) if quote is not None else None
            output.append(
                {
                    "company_id": company,
                    "quantity": str(position["quantity"]),
                    "cost": str(position["cost"]),
                    "value": str(value) if value is not None else None,
                    "unrealized": str(value - position["cost"]) if value is not None else None,
                }
            )
    complete = all(x["value"] is not None for x in output)
    return {
        "positions": output,
        "cost": str(sum(D(x["cost"]) for x in output)),
        "market_value": str(sum(D(x["value"]) for x in output)) if complete else None,
        "unrealized": str(sum(D(x["unrealized"]) for x in output)) if complete else None,
        "realized": str(realized),
        "dividends": str(dividends),
        "currency": "USD",
        "returns_available": False,
        "valuation_status": "demo_snapshot" if complete else "missing_quotes",
    }
