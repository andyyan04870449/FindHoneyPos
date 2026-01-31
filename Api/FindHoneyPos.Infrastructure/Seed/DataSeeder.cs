namespace FindHoneyPos.Infrastructure.Seed;

using FindHoneyPos.Core.Entities;
using FindHoneyPos.Core.Enums;
using FindHoneyPos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

public static class DataSeeder
{
    public static async Task SeedAsync(AppDbContext context, ILogger logger)
    {
        if (await context.Products.AnyAsync())
        {
            logger.LogInformation("Database already seeded, skipping.");
            return;
        }

        logger.LogInformation("Seeding database...");

        // Products (from Frontend products.ts + Backend mockData.ts)
        var products = new List<Product>
        {
            new() { Name = "抹茶紅豆瑪德蓮", Price = 70, IsPopular = true, Category = "蛋糕", SortOrder = 1 },
            new() { Name = "芝士蛋糕", Price = 80, IsPopular = true, Category = "蛋糕", SortOrder = 2 },
            new() { Name = "草莓蛋糕", Price = 75, IsPopular = true, Category = "蛋糕", SortOrder = 3 },
            new() { Name = "檸檬塔", Price = 65, Category = "蛋糕", SortOrder = 4 },
            new() { Name = "焦糖布丁", Price = 60, Category = "布丁", SortOrder = 5 },
            new() { Name = "藍莓司康", Price = 55, Category = "餅乾", SortOrder = 6 },
            new() { Name = "杏仁餅乾", Price = 45, Category = "餅乾", SortOrder = 7 },
            new() { Name = "巧克力泡芙", Price = 65, Category = "泡芙", SortOrder = 8 },
            new() { Name = "芒果慕斯", Price = 80, Category = "蛋糕", SortOrder = 9 },
            new() { Name = "法式馬卡龍", Price = 45, Category = "餅乾", SortOrder = 10 },
            new() { Name = "香蕉蛋糕", Price = 55, Category = "蛋糕", SortOrder = 11 },
            new() { Name = "奶油可頌", Price = 50, Category = "餅乾", SortOrder = 12 },
            new() { Name = "花生酥", Price = 40, Category = "餅乾", SortOrder = 13 },
            new() { Name = "椰子塔", Price = 60, Category = "蛋糕", SortOrder = 14 },
            new() { Name = "紫薯酥", Price = 50, Category = "餅乾", SortOrder = 15 },
        };
        context.Products.AddRange(products);
        await context.SaveChangesAsync();

        // Discounts (from Backend mockData.ts)
        var discounts = new List<Discount>
        {
            new() { Name = "9折優惠", Type = DiscountType.Percentage, Value = 10, MinPurchase = 0, IsActive = true, Description = "全場9折優惠" },
            new() { Name = "85折優惠", Type = DiscountType.Percentage, Value = 15, MinPurchase = 0, IsActive = true, Description = "全場85折優惠" },
            new() { Name = "8折優惠", Type = DiscountType.Percentage, Value = 20, MinPurchase = 0, IsActive = true, Description = "全場8折優惠" },
            new() { Name = "75折優惠", Type = DiscountType.Percentage, Value = 25, MinPurchase = 0, IsActive = true, Description = "全場75折優惠" },
            new() { Name = "滿500折50", Type = DiscountType.Amount, Value = 50, MinPurchase = 500, IsActive = true, Description = "消費滿NT$500折NT$50" },
            new() { Name = "滿1000折150", Type = DiscountType.Amount, Value = 150, MinPurchase = 1000, IsActive = true, Description = "消費滿NT$1,000折NT$150" },
            new() { Name = "買5送1", Type = DiscountType.Gift, Value = 1, MinPurchase = 5, IsActive = false, Description = "購買5件商品贈送1件" },
        };
        context.Discounts.AddRange(discounts);
        await context.SaveChangesAsync();

        // Sample Orders (from Backend mockData.ts)
        var now = DateTime.UtcNow.Date;
        var orders = new List<Order>
        {
            new()
            {
                OrderNumber = "#0127", DailySequence = 127, DeviceId = "POS-SEED",
                Subtotal = 440, DiscountAmount = 66, DiscountType = Core.Enums.DiscountType.Percentage, DiscountValue = 15,
                Total = 374, Status = OrderStatus.Completed, PaymentMethod = PaymentMethod.Cash,
                Timestamp = now.AddHours(9).AddMinutes(20),
                Items = new List<OrderItem>
                {
                    new() { ProductId = 6, ProductName = "藍莓司康", Price = 55, Quantity = 3, Subtotal = 165 },
                    new() { ProductId = 1, ProductName = "抹茶紅豆瑪德蓮", Price = 70, Quantity = 3, Subtotal = 210 },
                }
            },
            new()
            {
                OrderNumber = "#0128", DailySequence = 128, DeviceId = "POS-SEED",
                Subtotal = 610, DiscountAmount = 0, Total = 610,
                Status = OrderStatus.Completed, PaymentMethod = PaymentMethod.CreditCard,
                Timestamp = now.AddHours(10).AddMinutes(45),
                Items = new List<OrderItem>
                {
                    new() { ProductId = 9, ProductName = "芒果慕斯", Price = 80, Quantity = 2, Subtotal = 160 },
                    new() { ProductId = 3, ProductName = "草莓蛋糕", Price = 75, Quantity = 3, Subtotal = 225 },
                }
            },
            new()
            {
                OrderNumber = "#0129", DailySequence = 129, DeviceId = "POS-SEED",
                Subtotal = 485, DiscountAmount = 48, DiscountType = Core.Enums.DiscountType.Percentage, DiscountValue = 10,
                Total = 437, Status = OrderStatus.Completed, PaymentMethod = PaymentMethod.Cash,
                Timestamp = now.AddHours(11).AddMinutes(30),
                Items = new List<OrderItem>
                {
                    new() { ProductId = 8, ProductName = "巧克力泡芙", Price = 65, Quantity = 5, Subtotal = 325 },
                    new() { ProductId = 2, ProductName = "芝士蛋糕", Price = 80, Quantity = 2, Subtotal = 160 },
                }
            },
            new()
            {
                OrderNumber = "#0130", DailySequence = 130, DeviceId = "POS-SEED",
                Subtotal = 270, DiscountAmount = 0, Total = 270,
                Status = OrderStatus.Completed, PaymentMethod = PaymentMethod.LinePay,
                Timestamp = now.AddHours(12).AddMinutes(15),
                Items = new List<OrderItem>
                {
                    new() { ProductId = 7, ProductName = "杏仁餅乾", Price = 45, Quantity = 4, Subtotal = 180 },
                    new() { ProductId = 10, ProductName = "法式馬卡龍", Price = 45, Quantity = 2, Subtotal = 90 },
                }
            },
            new()
            {
                OrderNumber = "#0131", DailySequence = 131, DeviceId = "POS-SEED",
                Subtotal = 310, DiscountAmount = 31, DiscountType = Core.Enums.DiscountType.Percentage, DiscountValue = 10,
                Total = 279, Status = OrderStatus.Completed, PaymentMethod = PaymentMethod.Cash,
                Timestamp = now.AddHours(13).AddMinutes(20),
                Items = new List<OrderItem>
                {
                    new() { ProductId = 5, ProductName = "焦糖布丁", Price = 60, Quantity = 3, Subtotal = 180 },
                    new() { ProductId = 4, ProductName = "檸檬塔", Price = 65, Quantity = 2, Subtotal = 130 },
                }
            },
            new()
            {
                OrderNumber = "#0132", DailySequence = 132, DeviceId = "POS-SEED",
                Subtotal = 75, DiscountAmount = 0, Total = 75,
                Status = OrderStatus.Cancelled, PaymentMethod = PaymentMethod.Cash,
                Timestamp = now.AddHours(14),
                Items = new List<OrderItem>
                {
                    new() { ProductId = 3, ProductName = "草莓蛋糕", Price = 75, Quantity = 1, Subtotal = 75 },
                }
            },
        };
        context.Orders.AddRange(orders);
        await context.SaveChangesAsync();

        // LINE OA Settings
        context.LineOaSettings.Add(new LineOaSetting
        {
            ChannelId = "", ChannelSecret = "", AccessToken = "",
            IsConnected = false, AutoReply = true, OrderNotification = true, PromotionNotification = false
        });

        // Message Templates
        var templates = new List<MessageTemplate>
        {
            new() { Name = "訂單確認通知", Type = "order", Content = "您的訂單 {order_number} 已確認！\n總金額：NT$ {total}\n預計完成時間：{estimated_time}", IsActive = true },
            new() { Name = "每日營業報表", Type = "daily_report", Content = "【日結報表】\n日期：{date}\n訂單數：{order_count}\n營業額：NT$ {revenue}\n實收金額：NT$ {net_revenue}", IsActive = true },
            new() { Name = "促銷活動通知", Type = "promotion", Content = "限時優惠活動！\n{promotion_title}\n{promotion_description}\n活動期間：{start_date} - {end_date}", IsActive = false },
        };
        context.MessageTemplates.AddRange(templates);
        await context.SaveChangesAsync();

        logger.LogInformation("Database seeded successfully.");
    }
}
