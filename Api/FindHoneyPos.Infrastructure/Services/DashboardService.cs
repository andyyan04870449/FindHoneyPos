namespace FindHoneyPos.Infrastructure.Services;

using FindHoneyPos.Core.Enums;
using FindHoneyPos.Core.Interfaces;
using FindHoneyPos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

public class DashboardService : IDashboardService
{
    private readonly AppDbContext _context;

    public DashboardService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<object> GetKpiAsync()
    {
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);
        var yesterday = today.AddDays(-1);

        var todayOrders = _context.Orders.Where(o => o.Timestamp >= today && o.Timestamp < tomorrow && o.Status == OrderStatus.Completed);
        var yesterdayOrders = _context.Orders.Where(o => o.Timestamp >= yesterday && o.Timestamp < today && o.Status == OrderStatus.Completed);

        var todayRevenue = await todayOrders.SumAsync(o => (decimal?)o.Total) ?? 0;
        var todayCount = await todayOrders.CountAsync();
        var productCount = await _context.Products.CountAsync(p => p.Status == ProductStatus.Active);
        var avgOrder = todayCount > 0 ? Math.Round(todayRevenue / todayCount, 0) : 0;

        var yRevenue = await yesterdayOrders.SumAsync(o => (decimal?)o.Total) ?? 0;
        var yCount = await yesterdayOrders.CountAsync();
        var yAvg = yCount > 0 ? Math.Round(yRevenue / yCount, 0) : 0;

        var revenueChange = yRevenue > 0 ? Math.Round((todayRevenue - yRevenue) / yRevenue * 100, 1) : 0;
        var countChange = yCount > 0 ? Math.Round((decimal)(todayCount - yCount) / yCount * 100, 1) : 0;
        var avgChange = yAvg > 0 ? Math.Round((avgOrder - yAvg) / yAvg * 100, 1) : 0;

        return new[]
        {
            new { title = "今日營業額", value = $"NT$ {todayRevenue:N0}", change = $"{(revenueChange >= 0 ? "+" : "")}{revenueChange}%", color = "text-green-600", bgColor = "bg-green-50" },
            new { title = "今日訂單", value = todayCount.ToString(), change = $"{(countChange >= 0 ? "+" : "")}{countChange}%", color = "text-blue-600", bgColor = "bg-blue-50" },
            new { title = "商品數量", value = productCount.ToString(), change = $"+{productCount}", color = "text-purple-600", bgColor = "bg-purple-50" },
            new { title = "平均客單價", value = $"NT$ {avgOrder:N0}", change = $"{(avgChange >= 0 ? "+" : "")}{avgChange}%", color = "text-orange-600", bgColor = "bg-orange-50" },
        };
    }

    public async Task<object> GetSalesTrendAsync(int days)
    {
        var end = DateTime.UtcNow.Date.AddDays(1);
        var start = end.AddDays(-days);

        var orders = await _context.Orders
            .Where(o => o.Timestamp >= start && o.Timestamp < end && o.Status == OrderStatus.Completed)
            .ToListAsync();

        var trend = Enumerable.Range(0, days).Select(i =>
        {
            var day = DateTime.UtcNow.Date.AddDays(-days + 1 + i);
            var dayEnd = day.AddDays(1);
            var dayOrders = orders.Where(o => o.Timestamp >= day && o.Timestamp < dayEnd);
            return new
            {
                date = $"{day.Month}/{day.Day}",
                sales = dayOrders.Sum(o => o.Total),
                orders = dayOrders.Count()
            };
        });

        return trend;
    }

    public async Task<object> GetAddonKpiAsync()
    {
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);
        var yesterday = today.AddDays(-1);

        // 今日資料
        var todayItems = await _context.OrderItems
            .Include(oi => oi.Addons)
            .Include(oi => oi.Order)
            .Where(oi => oi.Order.Timestamp >= today && oi.Order.Timestamp < tomorrow && oi.Order.Status == OrderStatus.Completed)
            .ToListAsync();

        var todayAddonRevenue = todayItems.SelectMany(oi => oi.Addons).Sum(a => a.Price);
        var todayAddonCount = todayItems.SelectMany(oi => oi.Addons).Count();
        var todayTotalItems = todayItems.Count;
        var todayItemsWithAddon = todayItems.Count(oi => oi.Addons.Any());
        var todayAddonRate = todayTotalItems > 0 ? Math.Round((decimal)todayItemsWithAddon / todayTotalItems * 100, 1) : 0;

        // 昨日資料
        var yesterdayItems = await _context.OrderItems
            .Include(oi => oi.Addons)
            .Include(oi => oi.Order)
            .Where(oi => oi.Order.Timestamp >= yesterday && oi.Order.Timestamp < today && oi.Order.Status == OrderStatus.Completed)
            .ToListAsync();

        var yAddonRevenue = yesterdayItems.SelectMany(oi => oi.Addons).Sum(a => a.Price);
        var yAddonCount = yesterdayItems.SelectMany(oi => oi.Addons).Count();
        var yTotalItems = yesterdayItems.Count;
        var yItemsWithAddon = yesterdayItems.Count(oi => oi.Addons.Any());
        var yAddonRate = yTotalItems > 0 ? Math.Round((decimal)yItemsWithAddon / yTotalItems * 100, 1) : 0;

        var revenueChange = yAddonRevenue > 0 ? Math.Round((todayAddonRevenue - yAddonRevenue) / yAddonRevenue * 100, 1) : 0;
        var countChange = yAddonCount > 0 ? Math.Round((decimal)(todayAddonCount - yAddonCount) / yAddonCount * 100, 1) : 0;
        var rateChange = yAddonRate > 0 ? Math.Round(todayAddonRate - yAddonRate, 1) : 0;

        return new[]
        {
            new { title = "加料營收", value = $"NT$ {todayAddonRevenue:N0}", change = $"{(revenueChange >= 0 ? "+" : "")}{revenueChange}%", color = "text-green-600", bgColor = "bg-green-50" },
            new { title = "加料次數", value = todayAddonCount.ToString(), change = $"{(countChange >= 0 ? "+" : "")}{countChange}%", color = "text-blue-600", bgColor = "bg-blue-50" },
            new { title = "加料率", value = $"{todayAddonRate}%", change = $"{(rateChange >= 0 ? "+" : "")}{rateChange}%", color = "text-purple-600", bgColor = "bg-purple-50" },
        };
    }

    public async Task<object> GetCustomerTagKpiAsync()
    {
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);

        var orders = await _context.Orders
            .Where(o => o.Timestamp >= today && o.Timestamp < tomorrow && o.Status == OrderStatus.Completed)
            .ToListAsync();

        var genderTags = new[] { "男", "女" };
        var ageTags = new[] { "成人", "學生" };

        return new
        {
            gender = BuildTagStats(orders, genderTags),
            age = BuildTagStats(orders, ageTags)
        };
    }

    private static List<object> BuildTagStats(List<Core.Entities.Order> orders, string[] knownTags)
    {
        var result = new List<object>();
        foreach (var tag in knownTags)
        {
            var matched = orders.Where(o =>
                !string.IsNullOrEmpty(o.CustomerTag) &&
                o.CustomerTag.Split(',').Contains(tag));
            result.Add(new { tag, orders = matched.Count(), revenue = matched.Sum(o => o.Total) });
        }
        var untagged = orders.Where(o => string.IsNullOrEmpty(o.CustomerTag) ||
            !knownTags.Any(t => o.CustomerTag.Split(',').Contains(t)));
        result.Add(new { tag = "未標記", orders = untagged.Count(), revenue = untagged.Sum(o => o.Total) });
        return result;
    }

    public async Task<object> GetTopProductsAsync(int limit)
    {
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);

        var items = await _context.OrderItems
            .Include(oi => oi.Order)
            .Where(oi => oi.Order.Timestamp >= today && oi.Order.Timestamp < tomorrow && oi.Order.Status == OrderStatus.Completed)
            .ToListAsync();

        var top = items
            .GroupBy(i => i.ProductName)
            .Select(g => new
            {
                name = g.Key,
                sales = g.Sum(i => i.Quantity),
                revenue = $"NT$ {g.Sum(i => i.Subtotal):N0}"
            })
            .OrderByDescending(g => g.sales)
            .Take(limit);

        return top;
    }
}
