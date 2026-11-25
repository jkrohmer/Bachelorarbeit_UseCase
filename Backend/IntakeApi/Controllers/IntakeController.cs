using IntakeApi.Dtos;
using IntakeApi.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace IntakeApi.Controllers;

/// <summary>
/// Endpunkte für den Intake-Ablauf. Der komplette Zustand liegt im Backend:
/// Änderungen werden als Delta per PATCH geschickt, jede Antwort enthält den vollständigen neuen Zustand.
/// </summary>
[ApiController]
[Route("api/intake")]
public class IntakeController(IIntakeService intakeService) : ControllerBase
{
    /// <summary>Excel-Datei hochladen und neue Session anlegen.</summary>
    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(50 * 1024 * 1024)]
    public async Task<ActionResult<IntakeStateDto>> Upload(IFormFile file)
    {
        return Ok(await intakeService.UploadAsync(file));
    }

    /// <summary>Aktuellen Zustand einer Session abrufen (z. B. nach einem Browser-Reload).</summary>
    [HttpGet("{sessionId:guid}")]
    public ActionResult<IntakeStateDto> GetState(Guid sessionId)
    {
        return Ok(intakeService.GetState(sessionId));
    }

    /// <summary>Konfiguration ändern (Sheet, Extraction Range, Target Format). Nur gesetzte Felder werden übernommen.</summary>
    [HttpPatch("{sessionId:guid}")]
    public ActionResult<IntakeStateDto> Update(Guid sessionId, [FromBody] IntakeUpdateDto update)
    {
        return Ok(intakeService.Update(sessionId, update));
    }

    /// <summary>Einzelne Zellen eines Sheets ändern.</summary>
    [HttpPatch("{sessionId:guid}/cells")]
    public ActionResult<IntakeStateDto> UpdateCells(Guid sessionId, [FromBody] CellsUpdateDto update)
    {
        return Ok(intakeService.UpdateCells(sessionId, update));
    }

    /// <summary>Mapping-Ergebnis des aktuellen Zustands als Excel-Datei herunterladen.</summary>
    [HttpGet("{sessionId:guid}/download")]
    public IActionResult Download(Guid sessionId)
    {
        var (content, fileName) = intakeService.ExportResult(sessionId);
        return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }
}
