using IntakeApi.Dtos;
using IntakeApi.Models;

namespace IntakeApi.Services.Interfaces;

/// <summary>Liest eine Excel-Datei (.xlsx) ein.</summary>
public interface IExcelReaderService
{
    List<SheetData> ReadWorkbook(Stream stream);
}

/// <summary>Erzeugt aus einem Mapping-Ergebnis eine Excel-Datei.</summary>
public interface IExcelExportService
{
    byte[] CreateWorkbook(MappingResult result);
}

/// <summary>Speichert Intake-Sessions.</summary>
public interface ISessionStore
{
    void Save(IntakeSession session);
    IntakeSession? Get(Guid id);
}

/// <summary>Stellt die verfügbaren Zielformate bereit.</summary>
public interface ITargetFormatService
{
    IReadOnlyList<TargetFormat> GetAll();
    TargetFormat? GetById(string id);
}

/// <summary>Führt das Mapping eines Sheet-Bereichs auf ein Zielformat aus.</summary>
public interface IMappingService
{
    MappingResult Map(SheetData sheet, CellRange range, TargetFormat format);
}

/// <summary>Orchestriert den gesamten Intake-Ablauf (wird von den Controllern genutzt).</summary>
public interface IIntakeService
{
    Task<UploadResponseDto> UploadAsync(IFormFile file);
    SheetPreviewDto GetSheetPreview(Guid sessionId, string sheetName, string? range = null);
    ExtractionConfigResponseDto SaveExtractionConfig(Guid sessionId, ExtractionConfigDto config);
    MappingResultDto ExecuteMapping(Guid sessionId);
    MappingResultDto GetMappingResult(Guid sessionId);
    (byte[] Content, string FileName) ExportResult(Guid sessionId);
}
