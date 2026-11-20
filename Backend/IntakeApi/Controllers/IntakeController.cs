using IntakeApi.Dtos;
using IntakeApi.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace IntakeApi.Controllers;

/// <summary>
/// Endpunkte für den Intake-Ablauf: Upload, Sheet-Vorschau, Extraction-Konfiguration,
/// Mapping, Ergebnis und Download.
/// </summary>
[ApiController]
[Route("api/intake")]
public class IntakeController(IIntakeService intakeService) : ControllerBase
{
    /// <summary>Schritt 1: Excel-Datei hochladen.</summary>
    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(50 * 1024 * 1024)]
    public async Task<ActionResult<UploadResponseDto>> Upload(IFormFile file)
    {
        var response = await intakeService.UploadAsync(file);
        return Ok(response);
    }

    /// <summary>Vorschau eines Sheets (Schritt 1 und 2).</summary>
    [HttpGet("{sessionId:guid}/sheets/{sheetName}")]
    public ActionResult<SheetPreviewDto> GetSheetPreview(Guid sessionId, string sheetName, [FromQuery] string? range)
    {
        return Ok(intakeService.GetSheetPreview(sessionId, sheetName, range));
    }

    /// <summary>Schritt 2: Extraction Range und Target Format speichern.</summary>
    [HttpPut("{sessionId:guid}/extraction")]
    public ActionResult<ExtractionConfigResponseDto> SaveExtractionConfig(Guid sessionId, [FromBody] ExtractionConfigDto config)
    {
        return Ok(intakeService.SaveExtractionConfig(sessionId, config));
    }

    /// <summary>Schritt 3: Mapping ausführen.</summary>
    [HttpPost("{sessionId:guid}/mapping")]
    public ActionResult<MappingResultDto> ExecuteMapping(Guid sessionId)
    {
        return Ok(intakeService.ExecuteMapping(sessionId));
    }

    /// <summary>Schritt 3/4: zuletzt berechnetes Mapping-Ergebnis abrufen.</summary>
    [HttpGet("{sessionId:guid}/result")]
    public ActionResult<MappingResultDto> GetResult(Guid sessionId)
    {
        return Ok(intakeService.GetMappingResult(sessionId));
    }

    /// <summary>Schritt 4: Ergebnis als Excel-Datei herunterladen.</summary>
    [HttpGet("{sessionId:guid}/download")]
    public IActionResult Download(Guid sessionId)
    {
        var (content, fileName) = intakeService.ExportResult(sessionId);
        return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }
}
