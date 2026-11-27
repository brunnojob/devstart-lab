package shop;
public final class Orders {
    public static int checkout(int price, int quantity) { return Pricing.total(price, quantity); }
}
