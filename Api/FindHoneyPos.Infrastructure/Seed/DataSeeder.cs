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

        // Products — 純系列
        var products = new List<Product>
        {
            new() { Name = "奶油卡士達", Price = 60, Category = "純系列", SortOrder = 1 },
            new() { Name = "巧克力卡士達", Price = 60, Category = "純系列", SortOrder = 2 },
            new() { Name = "純紅豆", Price = 60, Category = "純系列", SortOrder = 3 },
            new() { Name = "純起司", Price = 60, Category = "純系列", SortOrder = 4 },
            // 甜味
            new() { Name = "杏仁蜜糖", Price = 60, Category = "甜味", SortOrder = 5 },
            new() { Name = "OREO卡士達", Price = 70, IsPopular = true, Category = "甜味", SortOrder = 6 },
            new() { Name = "奶油紅豆", Price = 70, Category = "甜味", SortOrder = 7 },
            new() { Name = "焙茶麻糬", Price = 70, Category = "甜味", SortOrder = 8 },
            new() { Name = "抹茶紅豆", Price = 70, Category = "甜味", SortOrder = 9 },
            new() { Name = "紅豆麻糬", Price = 70, IsPopular = true, Category = "甜味", SortOrder = 10 },
            // 冰鯛
            new() { Name = "牛奶卡士達冰", Price = 65, Category = "冰鯛", SortOrder = 11 },
            new() { Name = "巧克力卡士達冰", Price = 65, Category = "冰鯛", SortOrder = 12 },
            // 鹹味
            new() { Name = "起司火腿", Price = 70, IsPopular = true, Category = "鹹味", SortOrder = 13 },
            new() { Name = "起司玉米", Price = 70, Category = "鹹味", SortOrder = 14 },
            new() { Name = "鮪魚玉米", Price = 70, Category = "鹹味", SortOrder = 15 },
            new() { Name = "起司薯泥", Price = 70, IsPopular = true, Category = "鹹味", SortOrder = 16 },
            // 加料
            new() { Name = "加料-OREO餅乾", Price = 10, Category = "加料", SortOrder = 17 },
            new() { Name = "加料-巧克力豆", Price = 10, Category = "加料", SortOrder = 18 },
            new() { Name = "加料-牛奶糖", Price = 10, Category = "加料", SortOrder = 19 },
            new() { Name = "加料-起司", Price = 10, Category = "加料", SortOrder = 20 },
            new() { Name = "加料-白玉麻糬", Price = 10, Category = "加料", SortOrder = 21 },
        };
        context.Products.AddRange(products);
        await context.SaveChangesAsync();

        // Discounts
        var discounts = new List<Discount>
        {
            new() { Name = "9折", Type = DiscountType.Percentage, Value = 33, IsActive = true, Description = "打九折" },
            new() { Name = "折5塊", Type = DiscountType.Amount, Value = 5, IsActive = true, Description = "折五塊" },
        };
        context.Discounts.AddRange(discounts);
        await context.SaveChangesAsync();

        // Incentive Settings
        context.IncentiveSettings.Add(new IncentiveSetting
        {
            IsEnabled = true,
            DailyTarget = 100,
        });
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
