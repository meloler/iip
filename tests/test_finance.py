from decimal import Decimal as D

import pytest
from pydantic import ValidationError

from server.domain import DCFInputs, dcf, ledger, ratio

BASE = dict(
    fcff="100", growth="0", wacc="0.1", terminal_growth="0", net_debt="200", shares="10", price="60", years=5
)


def test_zero_growth_perpetuity_reference():
    # Independent reference: perpetual 100 at 10% = EV 1000; equity 800; 10 shares = 80.
    result = dcf(DCFInputs(**BASE))
    assert abs(D(result["enterprise_value"]) - 1000) < D("1e-20")
    assert abs(D(result["value_per_share"]) - 80) < D("1e-20")
    assert abs(D(result["margin_of_safety"]) - D("0.25")) < D("1e-20")
    assert abs(D(result["projections"][0]["present_value"]) - D(100) / D("1.1")) < D("1e-20")


def test_one_year_reference_and_net_cash():
    # CF1=110, terminal=110; r=100%, g=0 -> EV=55+55=110, net cash 10 -> equity 120.
    # Domain caps r at 50%, so reference uses CF1=110, TV=220: EV=(110+220)/1.5=220.
    model = {**BASE, "growth": ".1", "wacc": ".5", "years": 1, "net_debt": "-10"}
    r = dcf(DCFInputs(**model))
    assert D(r["enterprise_value"]) == 220
    assert D(r["equity_value"]) == 230
    assert D(r["value_per_share"]) == 23


@pytest.mark.parametrize(
    "change",
    [
        {"wacc": ".02", "terminal_growth": ".02"},
        {"shares": 0},
        {"fcff": -1},
        {"fcff": "NaN"},
        {"years": 0},
        {"price": "Infinity"},
        {"growth": 1},
    ],
)
def test_invalid_dcf(change):
    with pytest.raises(ValidationError):
        DCFInputs(**{**BASE, **change})


def test_negative_equity_not_fake_margin():
    result = dcf(DCFInputs(**{**BASE, "net_debt": "2000"}))
    assert D(result["equity_value"]) < 0
    assert result["margin_of_safety"] is None


def trade(kind, quantity, price, fees="0", currency="USD"):
    return {
        "company_id": "demo",
        "kind": kind,
        "quantity": quantity,
        "price": price,
        "fees": fees,
        "currency": currency,
    }


def test_weighted_cost_sales_dividends_fractional():
    # 10*20+2 + 10*30+2 = 504; sell 5 at 40 less fee 1 -> realized 199 -126=73.
    rows = [
        trade("BUY", "10", "20", "2"),
        trade("BUY", "10", "30", "2"),
        trade("SELL", "5", "40", "1"),
        trade("DIVIDEND", "0", "15", "2"),
    ]
    p = ledger(rows, {"demo": "35"})
    assert p["cost"] == "378"
    assert D(p["realized"]) == 73
    assert D(p["unrealized"]) == 147
    assert D(p["dividends"]) == 13
    assert D(p["positions"][0]["quantity"]) == 15
    fraction = ledger([trade("BUY", ".125", "80", "1")], {"demo": "100"})
    assert D(fraction["cost"]) == 11
    assert D(fraction["market_value"]) == D("12.5")


def test_full_sale_missing_quote_and_oversell():
    assert ledger([trade("BUY", "2", "10"), trade("SELL", "2", "12")], {})["positions"] == []
    assert ledger([trade("BUY", "2", "10")], {})["market_value"] is None
    with pytest.raises(ValueError):
        ledger([trade("SELL", "1", "10")], {})
    with pytest.raises(ValueError):
        ledger([trade("BUY", "1", "10", currency="EUR")], {})


def test_missing_negative_ratio_denominators():
    assert ratio(D(10), None) is None
    assert ratio(D(10), D(0)) is None
    assert ratio(D(10), D(-5)) is None
    assert ratio(D(-10), D(5)) == "-2"
