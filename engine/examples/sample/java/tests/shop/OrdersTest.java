package shop;
public final class OrdersTest {
    public static void main(String[] args) {
        if (Orders.checkout(10, 2) != 20) throw new AssertionError("Order total mismatch");
    }
}
