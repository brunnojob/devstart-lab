namespace Shop;
public static class Orders
{
    public static int Checkout(int price, int quantity) => Pricing.Total(price, quantity);
}
