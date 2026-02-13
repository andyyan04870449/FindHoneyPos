namespace FindHoneyPos.Api.Controllers.Admin;

using FindHoneyPos.Api.DTOs;
using FindHoneyPos.Core.Entities;
using FindHoneyPos.Core.Enums;
using FindHoneyPos.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/materials")]
public class MaterialsController : ControllerBase
{
    private readonly IMaterialService _materialService;

    public MaterialsController(IMaterialService materialService)
    {
        _materialService = materialService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search = null, [FromQuery] string? status = null)
    {
        MaterialStatus? statusEnum = null;
        if (!string.IsNullOrEmpty(status) && Enum.TryParse<MaterialStatus>(status, true, out var parsed))
            statusEnum = parsed;

        var materials = await _materialService.GetAllAsync(search, statusEnum);
        var response = materials.Select(ToResponse);
        return Ok(ApiResponse<IEnumerable<MaterialResponse>>.Ok(response));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var m = await _materialService.GetByIdAsync(id);
        if (m is null) return NotFound(ApiResponse<object>.Fail("原物料不存在"));
        return Ok(ApiResponse<MaterialResponse>.Ok(ToResponse(m)));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateMaterialRequest request)
    {
        var material = new Material
        {
            Name = request.Name,
            Unit = request.Unit,
            CurrentStock = request.CurrentStock,
            AlertThreshold = request.AlertThreshold,
            Status = Enum.Parse<MaterialStatus>(request.Status, true)
        };
        var created = await _materialService.CreateAsync(material);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, ApiResponse<MaterialResponse>.Ok(ToResponse(created)));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateMaterialRequest request)
    {
        var material = new Material
        {
            Name = request.Name,
            Unit = request.Unit,
            AlertThreshold = request.AlertThreshold,
            Status = Enum.Parse<MaterialStatus>(request.Status, true)
        };
        var updated = await _materialService.UpdateAsync(id, material);
        if (updated is null) return NotFound(ApiResponse<object>.Fail("原物料不存在"));
        return Ok(ApiResponse<MaterialResponse>.Ok(ToResponse(updated)));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _materialService.DeleteAsync(id);
        if (!result) return BadRequest(ApiResponse<object>.Fail("無法刪除原物料（可能有配方使用中）"));
        return Ok(ApiResponse<object>.Ok(new { deleted = true }));
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> ToggleStatus(int id)
    {
        var m = await _materialService.ToggleStatusAsync(id);
        if (m is null) return NotFound(ApiResponse<object>.Fail("原物料不存在"));
        return Ok(ApiResponse<MaterialResponse>.Ok(ToResponse(m)));
    }

    [HttpPost("{id}/stock-in")]
    public async Task<IActionResult> StockIn(int id, [FromBody] StockInRequest request)
    {
        try
        {
            var record = await _materialService.StockInAsync(id, request.Quantity, request.Note);
            return Ok(ApiResponse<StockRecordResponse>.Ok(ToRecordResponse(record)));
        }
        catch (ArgumentException ex)
        {
            return NotFound(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpPost("{id}/adjust")]
    public async Task<IActionResult> Adjust(int id, [FromBody] StockAdjustRequest request)
    {
        try
        {
            var record = await _materialService.AdjustStockAsync(id, request.NewStock, request.Note);
            return Ok(ApiResponse<StockRecordResponse>.Ok(ToRecordResponse(record)));
        }
        catch (ArgumentException ex)
        {
            return NotFound(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpPost("{id}/waste")]
    public async Task<IActionResult> Waste(int id, [FromBody] StockWasteRequest request)
    {
        try
        {
            var record = await _materialService.WasteAsync(id, request.Quantity, request.Note);
            return Ok(ApiResponse<StockRecordResponse>.Ok(ToRecordResponse(record)));
        }
        catch (ArgumentException ex)
        {
            return NotFound(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpGet("{id}/records")]
    public async Task<IActionResult> GetRecords(int id, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var records = await _materialService.GetStockRecordsAsync(id, null, null, null, page, pageSize);
        var response = records.Select(ToRecordResponse);
        return Ok(ApiResponse<IEnumerable<StockRecordResponse>>.Ok(response));
    }

    [HttpGet("records")]
    public async Task<IActionResult> GetAllRecords(
        [FromQuery] int? materialId = null,
        [FromQuery] string? changeType = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        StockChangeType? changeTypeEnum = null;
        if (!string.IsNullOrEmpty(changeType) && Enum.TryParse<StockChangeType>(changeType, true, out var parsed))
            changeTypeEnum = parsed;

        var records = await _materialService.GetStockRecordsAsync(materialId, changeTypeEnum, startDate, endDate, page, pageSize);
        var response = records.Select(ToRecordResponse);
        return Ok(ApiResponse<IEnumerable<StockRecordResponse>>.Ok(response));
    }

    [HttpGet("alerts")]
    public async Task<IActionResult> GetAlerts()
    {
        var alerts = await _materialService.GetActiveAlertsAsync();
        var response = alerts.Select(a => new MaterialAlertResponse(
            a.Id,
            a.MaterialId,
            a.Material.Name,
            a.Material.Unit,
            a.StockLevel,
            a.AlertThreshold,
            a.IsNotified,
            a.CreatedAt
        ));
        return Ok(ApiResponse<IEnumerable<MaterialAlertResponse>>.Ok(response));
    }

    [HttpPost("alerts/{id}/resolve")]
    public async Task<IActionResult> ResolveAlert(int id)
    {
        await _materialService.ResolveAlertAsync(id);
        return Ok(ApiResponse<object>.Ok(new { resolved = true }));
    }

    [HttpGet("low-stock")]
    public async Task<IActionResult> GetLowStock()
    {
        var materials = await _materialService.GetLowStockMaterialsAsync();
        var response = materials.Select(ToResponse);
        return Ok(ApiResponse<IEnumerable<MaterialResponse>>.Ok(response));
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetStatus()
    {
        var status = await _materialService.GetMaterialStatusAsync();
        return Ok(ApiResponse<object>.Ok(status));
    }

    private static MaterialResponse ToResponse(Material m) => new(
        m.Id,
        m.Name,
        m.Unit,
        m.CurrentStock,
        m.AlertThreshold,
        m.Status.ToString(),
        m.CurrentStock <= m.AlertThreshold,
        m.CreatedAt,
        m.UpdatedAt
    );

    private static StockRecordResponse ToRecordResponse(MaterialStockRecord r) => new(
        r.Id,
        r.MaterialId,
        r.Material?.Name ?? "",
        r.ChangeType.ToString(),
        r.Quantity,
        r.StockBefore,
        r.StockAfter,
        r.OrderId,
        r.Note,
        r.CreatedAt
    );
}
