import csv


def total_orders(lines):
    """Return (order_count, total_cents) for a CSV stream."""
    count = 0
    cents = 0
    for order in csv.DictReader(lines):
        count += 1
        cents += int(order["total_centavos"])
    return count, cents
