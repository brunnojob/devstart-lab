namespace Shop.Tests;
public static class OrdersTests
{
    public static bool VerifyTotal() => Orders.Checkout(10, 2) == 20;
}
