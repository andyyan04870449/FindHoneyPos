namespace FindHoneyPos.Core.Enums;

public enum StockChangeType
{
    In,      // 入庫
    Out,     // 出庫（訂單消耗）
    Adjust,  // 盤點調整
    Waste    // 報廢
}
