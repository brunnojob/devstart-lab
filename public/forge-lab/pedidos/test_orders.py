import unittest

from orders import total_orders


class OrdersTest(unittest.TestCase):
    def test_adds_multiple_orders(self):
        self.assertEqual(total_orders(["id,total_centavos", "A,1200", "B,300"]), (2, 1500))

    def test_empty_batch(self):
        self.assertEqual(total_orders(["id,total_centavos"]), (0, 0))


if __name__ == "__main__":
    unittest.main()
