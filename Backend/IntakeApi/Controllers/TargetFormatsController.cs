using IntakeApi.Dtos;
using IntakeApi.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace IntakeApi.Controllers;

/// <summary>
/// Liefert die verfügbaren Zielformate (Target Formats).
/// </summary>
[ApiController]
[Route("api/target-formats")]
public class TargetFormatsController(ITargetFormatService targetFormatService) : ControllerBase
{
    [HttpGet]
    public ActionResult<IEnumerable<TargetFormatDto>> GetAll()
    {
        return Ok(targetFormatService.GetAll().Select(f => f.ToDto()));
    }

    [HttpGet("{id}")]
    public ActionResult<TargetFormatDto> GetById(string id)
    {
        var format = targetFormatService.GetById(id);
        return format is null ? NotFound(new ErrorResponseDto($"Target Format '{id}' existiert nicht.")) : Ok(format.ToDto());
    }
}
