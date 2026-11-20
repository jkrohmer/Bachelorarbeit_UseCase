using IntakeApi.Configuration;
using IntakeApi.Dtos;
using IntakeApi.Exceptions;
using IntakeApi.Models;
using IntakeApi.Services.Interfaces;
using Microsoft.Extensions.Options;

namespace IntakeApi.Services;

/// <summary>
/// Orchestriert die vier Schritte des Intake-Prozesses:
/// Upload -> Extraction Range / Target Format -> Mapping -> Preview / Download.
/// </summary>
public class IntakeService(
    IExcelReaderService excelReader,
    IExcelExportService excelExport,
    ISessionStore sessionStore,
    ITargetFormatService targetFormats,
    IMappingService mappingService,
    IOptions<IntakeOptions> options) : IIntakeService
{
    private static readonly string[] AllowedExtensions = [".xlsx", ".xlsm"];
    private readonly IntakeOptions _options = options.Value;

    // ---------- Schritt 1: Upload ----------

    public async Task<UploadResponseDto> UploadAsync(IFormFile file)
    {
        if (file is null || file.Length == 0)
            throw new ValidationException("Es wurde keine Datei hochgeladen.");

        if (file.Length > _options.MaxUploadSizeMb * 1024L * 1024L)
            throw new ValidationException($"Die Datei ist größer als {_options.MaxUploadSizeMb} MB.");

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
            throw new ValidationException("Nur Excel-Dateien (.xlsx, .xlsm) werden unterstützt.");

        await using var stream = new MemoryStream();
        await file.CopyToAsync(stream);
        stream.Position = 0;

        var sheets = excelReader.ReadWorkbook(stream);
        if (sheets.Count == 0)
            throw new ValidationException("Die Excel-Datei enthält keine Sheets.");

        var session = new IntakeSession { FileName = file.FileName, Sheets = sheets };
        sessionStore.Save(session);

        return new UploadResponseDto(
            session.Id,
            session.FileName,
            sheets.Select(s => s.ToInfoDto()).ToList(),
            _options.DefaultExtractionRange);
    }

    public SheetPreviewDto GetSheetPreview(Guid sessionId, string sheetName, string? range = null)
    {
        var session = GetSession(sessionId);
        var sheet = GetSheet(session, sheetName);

        // Mindestens die (Default-)Range anzeigen, damit der Rahmen vollständig sichtbar ist
        if (!CellRange.TryParse(range, out var visibleRange))
            CellRange.TryParse(_options.DefaultExtractionRange, out visibleRange);

        var rows = Math.Min(Math.Max(sheet.RowCount, (visibleRange?.EndRow ?? -1) + 1), _options.PreviewMaxRows);
        var cols = Math.Min(Math.Max(sheet.ColumnCount, (visibleRange?.EndColumn ?? -1) + 1), _options.PreviewMaxColumns);

        var previewRows = Enumerable.Range(0, rows)
            .Select(r => (IReadOnlyList<string>)Enumerable.Range(0, cols).Select(c => sheet.GetCell(r, c)).ToList())
            .ToList();

        var letters = Enumerable.Range(0, cols).Select(CellRange.ColumnIndexToLetter).ToList();

        return new SheetPreviewDto(sheet.Name, sheet.RowCount, sheet.ColumnCount, letters, previewRows);
    }

    // ---------- Schritt 2: Extraction Range & Target Format ----------

    public ExtractionConfigResponseDto SaveExtractionConfig(Guid sessionId, ExtractionConfigDto config)
    {
        var session = GetSession(sessionId);
        var sheet = GetSheet(session, config.SheetName);

        if (!CellRange.TryParse(config.Range, out var range))
            throw new ValidationException($"'{config.Range}' ist keine gültige Range (Beispiel: A1:P30).");

        if (range.RowCount < 2)
            throw new ValidationException("Die Range muss mindestens eine Überschriftszeile und eine Datenzeile enthalten.");

        var format = targetFormats.GetById(config.TargetFormatId)
            ?? throw new NotFoundException($"Target Format '{config.TargetFormatId}' existiert nicht.");

        session.SelectedSheet = sheet.Name;
        session.ExtractionRange = range;
        session.TargetFormatId = format.Id;
        session.MappingResult = null; // alte Ergebnisse verwerfen

        return new ExtractionConfigResponseDto(sheet.Name, range.ToString(), format.Id, range.RowCount, range.ColumnCount);
    }

    // ---------- Schritt 3: Mapping ----------

    public MappingResultDto ExecuteMapping(Guid sessionId)
    {
        var session = GetSession(sessionId);

        if (session.SelectedSheet is null || session.ExtractionRange is null || session.TargetFormatId is null)
            throw new ValidationException("Extraction Range und Target Format müssen zuerst festgelegt werden.");

        var sheet = GetSheet(session, session.SelectedSheet);
        var format = targetFormats.GetById(session.TargetFormatId)
            ?? throw new NotFoundException($"Target Format '{session.TargetFormatId}' existiert nicht.");

        session.MappingResult = mappingService.Map(sheet, session.ExtractionRange, format);
        return session.MappingResult.ToDto();
    }

    // ---------- Schritt 4: Preview & Download ----------

    public MappingResultDto GetMappingResult(Guid sessionId) => GetResult(GetSession(sessionId)).ToDto();

    public (byte[] Content, string FileName) ExportResult(Guid sessionId)
    {
        var session = GetSession(sessionId);
        var result = GetResult(session);

        var baseName = Path.GetFileNameWithoutExtension(session.FileName);
        var fileName = $"{baseName}_{result.TargetFormatName.Replace(' ', '_')}.xlsx";

        return (excelExport.CreateWorkbook(result), fileName);
    }

    // ---------- Hilfsmethoden ----------

    private IntakeSession GetSession(Guid sessionId) =>
        sessionStore.Get(sessionId)
        ?? throw new NotFoundException("Die Session existiert nicht (mehr). Bitte die Datei erneut hochladen.");

    private static SheetData GetSheet(IntakeSession session, string sheetName) =>
        session.FindSheet(sheetName)
        ?? throw new NotFoundException($"Sheet '{sheetName}' existiert nicht.");

    private static MappingResult GetResult(IntakeSession session) =>
        session.MappingResult
        ?? throw new ValidationException("Es wurde noch kein Mapping ausgeführt.");
}
