namespace FindHoneyPos.Infrastructure.Services;

using System.Text;
using FindHoneyPos.Core.Constants;
using FindHoneyPos.Core.Enums;
using FindHoneyPos.Core.Interfaces;
using FindHoneyPos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

public class ReportService : IReportService
{
    private readonly AppDbContext _context;

    public ReportService(AppDbContext context)
    {
        _context = context;
    }

    private (DateTime start, DateTime end) GetDateRange(DateOnly date)
    {
        var start = date.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var end = start.AddDays(1);
        return (start, end);
    }

    public async Task<object> GetDailyReportAsync(DateOnly date)
    {
        var (start, end) = GetDateRange(date);
        var yesterday = date.AddDays(-1);
        var (yStart, yEnd) = GetDateRange(yesterday);

        var todayOrders = await _context.Orders
            .Include(o => o.Items)
            .Where(o => o.Timestamp >= start && o.Timestamp < end && o.Status == OrderStatus.Completed)
            .ToListAsync();
        var yesterdayOrders = _context.Orders.Where(o => o.Timestamp >= yStart && o.Timestamp < yEnd && o.Status == OrderStatus.Completed);

        var orderCount = todayOrders.Count;

        // 計算總折扣（Gift 類型特殊處理，避免重複計算）
        var totalDiscount = todayOrders.Sum(o =>
        {
            if (o.DiscountType == DiscountType.Gift)
            {
                // Gift 類型：折扣 = 訂單原價，不重複計算單品折扣
                return o.Subtotal;
            }
            else
            {
                // 其他類型：單品折扣 + 訂單折扣
                var itemDiscount = o.Items
                    .Where(i => i.OriginalPrice.HasValue)
                    .Sum(i => (i.OriginalPrice!.Value - i.Price) * i.Quantity);
                return itemDiscount + o.DiscountAmount;
            }
        });

        // 實收金額
        var netRevenue = todayOrders.Sum(o => o.Total);

        // 原始營業額（折扣前）
        var totalRevenue = netRevenue + totalDiscount;

        var avgOrderValue = orderCount > 0 ? netRevenue / orderCount : 0;

        var stockSold = await _context.OrderItems
            .Include(oi => oi.Order)
            .Where(oi => oi.Order.Timestamp >= start && oi.Order.Timestamp < end && oi.Order.Status == OrderStatus.Completed)
            .SumAsync(oi => (int?)oi.Quantity) ?? 0;

        var yOrderCount = await yesterdayOrders.CountAsync();
        var yRevenue = await yesterdayOrders.SumAsync(o => (decimal?)o.Total) ?? 0;

        var revenueChange = yRevenue > 0 ? Math.Round((double)((netRevenue - yRevenue) / yRevenue * 100), 1) : 0;
        var ordersChange = yOrderCount > 0 ? Math.Round((double)(orderCount - yOrderCount) / yOrderCount * 100, 1) : 0;

        return new
        {
            date = date.ToString("yyyy-MM-dd"),
            orderCount,
            totalRevenue,
            totalDiscount,
            netRevenue,
            averageOrderValue = Math.Round(avgOrderValue, 0),
            stockSold,
            comparisonYesterday = new { revenue = revenueChange, orders = ordersChange }
        };
    }

    public async Task<object> GetHourlySalesAsync(DateOnly date)
    {
        var (start, end) = GetDateRange(date);
        var orders = await _context.Orders
            .Where(o => o.Timestamp >= start && o.Timestamp < end && o.Status == OrderStatus.Completed)
            .ToListAsync();

        var hourly = Enumerable.Range(BusinessRules.BusinessHourStart, BusinessRules.BusinessHourEnd - BusinessRules.BusinessHourStart + 1)
            .Select(h =>
            {
                var hourOrders = orders.Where(o => o.Timestamp.Hour == h);
                return new
                {
                    hour = $"{h:D2}:00",
                    sales = hourOrders.Sum(o => o.Total),
                    orders = hourOrders.Count()
                };
            });

        return hourly;
    }

    public async Task<object> GetCategorySalesAsync(DateOnly date)
    {
        var (start, end) = GetDateRange(date);
        var items = await _context.OrderItems
            .Include(oi => oi.Order)
            .Include(oi => oi.Product)
            .Where(oi => oi.Order.Timestamp >= start && oi.Order.Timestamp < end && oi.Order.Status == OrderStatus.Completed)
            .ToListAsync();

        var total = items.Sum(i => i.Subtotal);
        var grouped = items
            .GroupBy(i => i.Product?.Category ?? "其他")
            .Select(g => new
            {
                name = g.Key,
                value = g.Sum(i => i.Subtotal),
                percentage = total > 0 ? Math.Round((double)(g.Sum(i => i.Subtotal) / total * 100), 0) : 0
            })
            .OrderByDescending(g => g.value);

        return grouped;
    }

    public async Task<object> GetPaymentMethodsAsync(DateOnly date)
    {
        var (start, end) = GetDateRange(date);
        var orders = await _context.Orders
            .Where(o => o.Timestamp >= start && o.Timestamp < end && o.Status == OrderStatus.Completed)
            .ToListAsync();

        var total = orders.Sum(o => o.Total);
        var grouped = orders
            .GroupBy(o => o.PaymentMethod)
            .Select(g => new
            {
                method = PaymentMethodMapping.ToDisplay(g.Key),
                count = g.Count(),
                amount = g.Sum(o => o.Total),
                percentage = total > 0 ? Math.Round((double)(g.Sum(o => o.Total) / total * 100), 1) : 0
            });

        return grouped;
    }

    public async Task<object> GetTopProductsAsync(DateOnly date)
    {
        var (start, end) = GetDateRange(date);
        var items = await _context.OrderItems
            .Include(oi => oi.Order)
            .Where(oi => oi.Order.Timestamp >= start && oi.Order.Timestamp < end && oi.Order.Status == OrderStatus.Completed)
            .ToListAsync();

        var top = items
            .GroupBy(i => i.ProductName)
            .Select(g => new
            {
                name = g.Key,
                quantity = g.Sum(i => i.Quantity),
                revenue = g.Sum(i => i.Subtotal)
            })
            .OrderByDescending(g => g.quantity)
            .Take(5);

        return top;
    }

    public async Task<object> GetTopAddonsAsync(DateOnly date)
    {
        var (start, end) = GetDateRange(date);
        var addons = await _context.OrderItemAddons
            .Include(a => a.OrderItem)
                .ThenInclude(oi => oi.Order)
            .Where(a => a.OrderItem.Order.Timestamp >= start && a.OrderItem.Order.Timestamp < end && a.OrderItem.Order.Status == OrderStatus.Completed)
            .ToListAsync();

        var top = addons
            .GroupBy(a => a.ProductName)
            .Select(g => new
            {
                name = g.Key,
                quantity = g.Count(),
                revenue = g.Sum(a => a.Price)
            })
            .OrderByDescending(g => g.quantity)
            .Take(10);

        return top;
    }

    public async Task<object> GetAddonProductCombinationsAsync(DateOnly date)
    {
        var (start, end) = GetDateRange(date);
        var addons = await _context.OrderItemAddons
            .Include(a => a.OrderItem)
                .ThenInclude(oi => oi.Order)
            .Where(a => a.OrderItem.Order.Timestamp >= start && a.OrderItem.Order.Timestamp < end && a.OrderItem.Order.Status == OrderStatus.Completed)
            .ToListAsync();

        var combos = addons
            .GroupBy(a => new { product = a.OrderItem.ProductName, addon = a.ProductName })
            .Select(g => new
            {
                product = g.Key.product,
                addon = g.Key.addon,
                count = g.Count(),
                revenue = g.Sum(a => a.Price)
            })
            .OrderByDescending(g => g.count)
            .Take(20);

        return combos;
    }

    public async Task<object> GetAddonRevenueTrendAsync(int days)
    {
        var end = DateTime.UtcNow.Date.AddDays(1);
        var start = end.AddDays(-days);

        var addons = await _context.OrderItemAddons
            .Include(a => a.OrderItem)
                .ThenInclude(oi => oi.Order)
            .Where(a => a.OrderItem.Order.Timestamp >= start && a.OrderItem.Order.Timestamp < end && a.OrderItem.Order.Status == OrderStatus.Completed)
            .ToListAsync();

        var trend = Enumerable.Range(0, days).Select(i =>
        {
            var day = DateTime.UtcNow.Date.AddDays(-days + 1 + i);
            var dayEnd = day.AddDays(1);
            var dayAddons = addons.Where(a => a.OrderItem.Order.Timestamp >= day && a.OrderItem.Order.Timestamp < dayEnd);
            return new
            {
                date = $"{day.Month}/{day.Day}",
                revenue = dayAddons.Sum(a => a.Price),
                count = dayAddons.Count()
            };
        });

        return trend;
    }

    public async Task<object> GetCustomerTagDistributionAsync(DateOnly date)
    {
        var (start, end) = GetDateRange(date);
        var orders = await _context.Orders
            .Where(o => o.Timestamp >= start && o.Timestamp < end && o.Status == OrderStatus.Completed)
            .ToListAsync();

        var genderTags = new[] { "男", "女" };
        var ageTags = new[] { "成人", "學生" };
        var relationTags = new[] { "攤商", "親友" };

        return new
        {
            gender = BuildTagDistribution(orders, genderTags),
            age = BuildTagDistribution(orders, ageTags),
            relation = BuildTagDistribution(orders, relationTags)
        };
    }

    private static List<object> BuildTagDistribution(List<Core.Entities.Order> orders, string[] knownTags)
    {
        var totalCount = orders.Count;
        var result = new List<object>();
        foreach (var tag in knownTags)
        {
            var matched = orders.Where(o =>
                !string.IsNullOrEmpty(o.CustomerTag) &&
                o.CustomerTag.Split(',').Contains(tag));
            var count = matched.Count();
            var revenue = matched.Sum(o => o.Total);
            var percentage = totalCount > 0 ? Math.Round((double)count / totalCount * 100, 1) : 0;
            result.Add(new { tag, orders = count, revenue, percentage });
        }
        var untagged = orders.Where(o => string.IsNullOrEmpty(o.CustomerTag) ||
            !knownTags.Any(t => o.CustomerTag.Split(',').Contains(t)));
        var untaggedCount = untagged.Count();
        var untaggedRevenue = untagged.Sum(o => o.Total);
        var untaggedPct = totalCount > 0 ? Math.Round((double)untaggedCount / totalCount * 100, 1) : 0;
        result.Add(new { tag = "未標記", orders = untaggedCount, revenue = untaggedRevenue, percentage = untaggedPct });
        return result;
    }

    public async Task<object> GetInventorySummaryAsync(DateOnly date)
    {
        // 取該日最新的 DailySettlement（含 InventoryCounts）
        var settlement = await _context.DailySettlements
            .Include(ds => ds.InventoryCounts)
                .ThenInclude(ic => ic.Product)
            .Where(ds => ds.Date == date)
            .OrderByDescending(ds => ds.SubmittedAt)
            .FirstOrDefaultAsync();

        if (settlement == null)
            return Array.Empty<object>();

        // 計算當日售出數量（按 ProductId）
        var (start, end) = GetDateRange(date);

        // 嘗試透過 Shift 取得精確範圍
        var shift = await _context.Shifts.FirstOrDefaultAsync(s => s.SettlementId == settlement.Id);
        Dictionary<int, int> soldByProduct;

        if (shift != null)
        {
            soldByProduct = await _context.OrderItems
                .Include(oi => oi.Order)
                .Where(oi => oi.Order.ShiftId == shift.Id
                    && oi.Order.Status == OrderStatus.Completed
                    && oi.ProductId != null)
                .GroupBy(oi => oi.ProductId!.Value)
                .ToDictionaryAsync(g => g.Key, g => g.Sum(oi => oi.Quantity));
        }
        else
        {
            soldByProduct = await _context.OrderItems
                .Include(oi => oi.Order)
                .Where(oi => oi.Order.Timestamp >= start && oi.Order.Timestamp < end
                    && oi.Order.Status == OrderStatus.Completed
                    && oi.ProductId != null)
                .GroupBy(oi => oi.ProductId!.Value)
                .ToDictionaryAsync(g => g.Key, g => g.Sum(oi => oi.Quantity));
        }

        var result = settlement.InventoryCounts.Select(ic => new
        {
            productName = ic.Product?.Name ?? $"商品#{ic.ProductId}",
            soldQuantity = soldByProduct.GetValueOrDefault(ic.ProductId, 0),
            remainingQuantity = ic.Quantity
        });

        return result;
    }

    public async Task<byte[]> ExportCsvAsync(DateOnly date)
    {
        var (start, end) = GetDateRange(date);
        var orders = await _context.Orders
            .Include(o => o.Items)
            .Where(o => o.Timestamp >= start && o.Timestamp < end)
            .OrderBy(o => o.Timestamp)
            .ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("訂單編號,時間,商品,小計,折扣,總計,付款方式,狀態,客群標記");
        foreach (var order in orders)
        {
            var itemsStr = string.Join("; ", order.Items.Select(i => $"{i.ProductName}x{i.Quantity}"));
            var status = order.Status == OrderStatus.Completed ? "已完成" : "已取消";
            var payment = PaymentMethodMapping.ToDisplay(order.PaymentMethod);
            var customerTag = order.CustomerTag ?? "";
            sb.AppendLine($"{order.OrderNumber},{order.Timestamp:HH:mm},{itemsStr},{order.Subtotal},{order.DiscountAmount},{order.Total},{payment},{status},{customerTag}");
        }

        return Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(sb.ToString())).ToArray();
    }
}
