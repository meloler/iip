"""Canonical provider boundary. Synthetic data never masquerades as market data."""

import os
from typing import Protocol

from server.domain import D, ratio


class FinancialProvider(Protocol):
    def companies(self) -> list[dict]: ...


class DemoProvider:
    def companies(self):
        seeds = [
            (
                "aster",
                "ASTD",
                "Aster Systems",
                "Tecnología",
                "US",
                "84.50",
                "4200",
                "840",
                "650",
                "780",
                "240",
                "120",
                "3800",
                "0.16",
                "0.09",
            ),
            (
                "faro",
                "FARD",
                "Faro Consumer",
                "Consumo",
                "ES",
                "42.80",
                "2600",
                "390",
                "260",
                "300",
                "520",
                "100",
                "1700",
                "0.12",
                "0.05",
            ),
            (
                "nexo",
                "NEXD",
                "Nexo Industrials",
                "Industria",
                "DE",
                "61.20",
                "5100",
                "510",
                "280",
                "340",
                "1100",
                "95",
                "2900",
                "0.08",
                "0.03",
            ),
            (
                "banco",
                "BNKD",
                "Banco Demo",
                "Financiero",
                "US",
                "18.40",
                "1800",
                "300",
                "-40",
                "-20",
                "900",
                "200",
                "-500",
                None,
                "-0.02",
            ),
        ]
        output = []
        for (
            key,
            ticker,
            name,
            sector,
            country,
            price,
            revenue,
            ebit,
            income,
            fcff,
            debt,
            shares,
            equity,
            roic,
            growth,
        ) in seeds:
            observations = []
            values = {
                "price": price,
                "revenue": revenue,
                "ebit": ebit,
                "net_income": income,
                "fcff": fcff,
                "net_debt": debt,
                "shares": shares,
                "book_equity": equity,
                "roic": roic,
            }
            for metric, value in values.items():
                observations.append(
                    {
                        "company_id": key,
                        "instrument_id": f"demo:{ticker}",
                        "exchange": "DEMO",
                        "currency": "USD",
                        "sector": sector,
                        "metric": metric,
                        "value": value,
                        "unit": "USD/share"
                        if metric == "price"
                        else "ratio"
                        if metric == "roic"
                        else "million shares"
                        if metric == "shares"
                        else "million USD",
                        "period": "FY2025" if metric != "price" else "snapshot",
                        "period_start": "2025-01-01" if metric != "price" else None,
                        "period_end": "2025-12-31",
                        "published_at": "2026-02-01T00:00:00Z",
                        "updated_at": "2026-02-01T00:00:00Z",
                        "source": "iip-synthetic-v1",
                        "data_type": "synthetic",
                        "availability": "available" if value is not None else "not_applicable",
                        "accounting_standard": "DEMO",
                        "revision": 1,
                    }
                )
            pe = ratio(D(price) * D(shares), D(income))
            pb = ratio(D(price) * D(shares), D(equity))
            output.append(
                {
                    "id": key,
                    "ticker": ticker,
                    "name": name,
                    "sector": sector,
                    "country": country,
                    "currency": "USD",
                    "exchange": "DEMO",
                    "price": price,
                    "revenue": revenue,
                    "ebit": ebit,
                    "net_income": income,
                    "fcff": fcff,
                    "net_debt": debt,
                    "shares": shares,
                    "roic": roic,
                    "growth": growth,
                    "pe": pe,
                    "pb": pb,
                    "operating_margin": str(D(ebit) / D(revenue)),
                    "market_cap": str(D(price) * D(shares)),
                    "dcf_applicable": sector != "Financiero" and D(fcff) > 0,
                    "description": "Empresa ficticia para probar el flujo de investigación. Todos sus importes, indicadores y características son sintéticos.",
                    "source": "iip-synthetic-v1",
                    "as_of": "2025-12-31",
                    "data_type": "synthetic",
                    "observations": observations,
                }
            )
        return output


class UnconfiguredProvider:
    def companies(self):
        return []


def provider() -> FinancialProvider:
    mode = os.environ.get("IIP_DATA_MODE", "demo")
    if mode not in ("demo", "real"):
        raise RuntimeError("IIP_DATA_MODE must be demo or real")
    return DemoProvider() if mode == "demo" else UnconfiguredProvider()
