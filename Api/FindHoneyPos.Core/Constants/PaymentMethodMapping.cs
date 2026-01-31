namespace FindHoneyPos.Core.Constants;

using FindHoneyPos.Core.Enums;

public static class PaymentMethodMapping
{
    private static readonly Dictionary<string, PaymentMethod> DisplayToEnum = new()
    {
        ["現金"] = PaymentMethod.Cash,
        ["信用卡"] = PaymentMethod.CreditCard,
        ["LINE Pay"] = PaymentMethod.LinePay,
    };

    private static readonly Dictionary<PaymentMethod, string> EnumToDisplay = new()
    {
        [PaymentMethod.Cash] = "現金",
        [PaymentMethod.CreditCard] = "信用卡",
        [PaymentMethod.LinePay] = "LINE Pay",
    };

    public static PaymentMethod FromDisplay(string display)
        => DisplayToEnum.TryGetValue(display, out var method) ? method : PaymentMethod.Cash;

    public static string ToDisplay(PaymentMethod method)
        => EnumToDisplay.TryGetValue(method, out var display) ? display : "現金";
}
