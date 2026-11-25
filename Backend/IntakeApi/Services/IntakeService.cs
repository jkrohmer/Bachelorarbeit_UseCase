using IntakeApi.Configuration;
using IntakeApi.Dtos;
using IntakeApi.Exceptions;
using IntakeApi.Models;
using IntakeApi.Services.Interfaces;
using Microsoft.Extensions.Options;

namespace IntakeApi.Services;

/// <summary>
/// Orchestriert den Intake-Prozess. Die Session im Backend ist die einzige Quelle der Wahrheit:
///  - Jede Änderung im Frontend wird als Delta geschickt (<see cref="Update"/>, <see cref="UpdateCells"/>)
///    und sofort in der Session gespeichert.
///  - Schrittwechsel laufen ausschließlich über <see cref="Next"/> und <see cref="Back"/>;
///    welche Wechsel erlaubt sind, entscheidet <see cref="IIntakeWorkflow"/>.
///  - Jede Operation antwortet mit dem vollständigen neuen Zustand (<see cref="IntakeStateDto"/>),
///    inkl. aktuellem Schritt, Sheet-Vorschau und neu berechnetem Mapping.
/// </summary>
public class IntakeService(
    IExcelReaderService excelReader,
    IExcelExportService excelExport,
    ISessionStore sessionStore,
    ITargetFormatService targetFormats,
    IMappingService mappingService,
    IIntakeWorkflow workflow,
    IOptions<IntakeOptions> options) : IIntakeService
{
    private static readonly string[] AllowedExtensions = [".xlsx", ".xlsm"];
    private const int MaxCellsPerRequest = 1000;
    private const int MaxCellLength = 32_767; // Excel-Limit pro Zelle

    private readonly IntakeOptions _options = options.Value;

    // ---------- Upload ----------

    public async Task<IntakeStateDto> UploadAsync(IFormFile file)
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

        // Startzustand: erstes Sheet, Standard-Range, erstes Target Format
        CellRange.TryParse(_options.DefaultExtractionRange, out var defaultRange);
        var session = new IntakeSession
        {
            FileName = file.FileName,
            Sheets = sheets,
            SelectedSheet = sheets[0].Name,
            ExtractionRange = defaultRange,
            TargetFormatId = targetFormats.GetAll().FirstOrDefault()?.Id
        };
        sessionStore.Save(session);

        return BuildState(session);
    }

    // ---------- Zustand lesen ----------

    public IntakeStateDto GetState(Guid sessionId)
    {
        var session = GetSession(sessionId);
        lock (session.SyncRoot)
        {
            return BuildState(session);
        }
    }

    // ---------- Konfiguration ändern (Delta) ----------

    public IntakeStateDto Update(Guid sessionId, IntakeUpdateDto update)
    {
        var session = GetSession(sessionId);
        lock (session.SyncRoot)
        {
            // Erst alles validieren, dann übernehmen – so wird ein Delta ganz oder gar nicht angewendet.
            var sheet = update.SheetName is null ? null : GetSheet(session, update.SheetName);
            var range = update.Range is null ? null : ParseRange(update.Range);
            var format = update.TargetFormatId is null
                ? null
                : targetFormats.GetById(update.TargetFormatId)
                  ?? throw new NotFoundException($"Target Format '{update.TargetFormatId}' existiert nicht.");

            if (sheet is not null) session.SelectedSheet = sheet.Name;
            if (range is not null) session.ExtractionRange = range;
            if (format is not null) session.TargetFormatId = format.Id;

            session.Touch();
            return BuildState(session);
        }
    }

    // ---------- Zellen ändern (Delta) ----------

    public IntakeStateDto UpdateCells(Guid sessionId, CellsUpdateDto update)
    {
        if (update.Cells is null || update.Cells.Count == 0)
            throw new ValidationException("Es wurden keine Zellen übergeben.");

        if (update.Cells.Count > MaxCellsPerRequest)
            throw new ValidationException($"Es können höchstens {MaxCellsPerRequest} Zellen auf einmal geändert werden.");

        var session = GetSession(sessionId);
        lock (session.SyncRoot)
        {
            var sheet = GetSheet(session, update.SheetName);

            // Bearbeitbar ist der vorhandene Sheet-Inhalt sowie (falls größer) die Extraction Range
            var maxRow = Math.Max(sheet.RowCount, (session.ExtractionRange?.EndRow ?? -1) + 1);
            var maxColumn = Math.Max(sheet.ColumnCount, (session.ExtractionRange?.EndColumn ?? -1) + 1);

            // Erst alles validieren, dann übernehmen
            var changes = update.Cells.Select(cell =>
            {
                if (!CellRange.TryParseCell(cell.Address, out var row, out var column))
                    throw new ValidationException($"'{cell.Address}' ist keine gültige Zelladresse (Beispiel: B5).");

                if (row >= maxRow || column >= maxColumn)
                    throw new ValidationException($"Die Zelle {cell.Address} liegt außerhalb des Sheets und der Extraction Range.");

                var value = cell.Value ?? string.Empty;
                if (value.Length > MaxCellLength)
                    throw new ValidationException($"Der Wert für {cell.Address} ist zu lang (max. {MaxCellLength} Zeichen).");

                return (row, column, value);
            }).ToList();

            foreach (var (row, column, value) in changes)
            {
                sheet.SetCell(row, column, value);
            }

            session.Touch();
            return BuildState(session);
        }
    }

    // ---------- Schrittwechsel ----------

    public IntakeStateDto Next(Guid sessionId)
    {
        var session = GetSession(sessionId);
        lock (session.SyncRoot)
        {
            session.CurrentStep = workflow.GetNextStep(session, BuildMapping(session));
            session.Touch();
            return BuildState(session);
        }
    }

    public IntakeStateDto Back(Guid sessionId)
    {
        var session = GetSession(sessionId);
        lock (session.SyncRoot)
        {
            session.CurrentStep = workflow.GetPreviousStep(session);
            session.Touch();
            return BuildState(session);
        }
    }

    // ---------- Download ----------

    public (byte[] Content, string FileName) ExportResult(Guid sessionId)
    {
        var session = GetSession(sessionId);
        MappingResult result;
        lock (session.SyncRoot)
        {
            result = BuildMapping(session)
                ?? throw new ValidationException("Extraction Range und Target Format müssen zuerst festgelegt werden.");
        }

        var baseName = Path.GetFileNameWithoutExtension(session.FileName);
        var fileName = $"{baseName}_{result.TargetFormatName.Replace(' ', '_')}.xlsx";

        return (excelExport.CreateWorkbook(result), fileName);
    }

    // ---------- Zustand aufbauen ----------

    /// <summary>Erstellt den vollständigen Zustand (Schritt, Konfiguration, Vorschau, Mapping) aus der Session.</summary>
    private IntakeStateDto BuildState(IntakeSession session)
    {
        var sheet = GetSheet(session, session.SelectedSheet);
        var mapping = BuildMapping(session);

        return new IntakeStateDto(
            session.Id,
            session.FileName,
            session.CurrentStep,
            workflow.GetAvailableActions(session, mapping),
            session.Sheets.Select(s => s.ToInfoDto()).ToList(),
            sheet.Name,
            session.ExtractionRange?.ToString(),
            session.TargetFormatId,
            BuildPreview(sheet, session.ExtractionRange),
            mapping?.ToDto(),
            session.LastModifiedAt);
    }

    /// <summary>Excel-ähnliche Vorschau. Zeigt mindestens die komplette Extraction Range (begrenzt durch die Optionen).</summary>
    private SheetPreviewDto BuildPreview(SheetData sheet, CellRange? range)
    {
        var rows = Math.Min(Math.Max(sheet.RowCount, (range?.EndRow ?? -1) + 1), _options.PreviewMaxRows);
        var cols = Math.Min(Math.Max(sheet.ColumnCount, (range?.EndColumn ?? -1) + 1), _options.PreviewMaxColumns);

        var previewRows = Enumerable.Range(0, rows)
            .Select(r => (IReadOnlyList<string>)Enumerable.Range(0, cols).Select(c => sheet.GetCell(r, c)).ToList())
            .ToList();

        var letters = Enumerable.Range(0, cols).Select(CellRange.ColumnIndexToLetter).ToList();

        var editedCells = sheet.EditedCells
            .Where(c => c.Row < rows && c.Column < cols)
            .Select(c => CellRange.ToAddress(c.Row, c.Column))
            .ToList();

        return new SheetPreviewDto(sheet.Name, sheet.RowCount, sheet.ColumnCount, letters, previewRows, editedCells);
    }

    /// <summary>Berechnet das Mapping aus dem aktuellen Zustand; null, solange die Konfiguration unvollständig ist.</summary>
    private MappingResult? BuildMapping(IntakeSession session)
    {
        if (session.ExtractionRange is null || session.TargetFormatId is null) return null;

        var format = targetFormats.GetById(session.TargetFormatId);
        if (format is null) return null;

        return mappingService.Map(GetSheet(session, session.SelectedSheet), session.ExtractionRange, format);
    }

    // ---------- Hilfsmethoden ----------

    private IntakeSession GetSession(Guid sessionId) =>
        sessionStore.Get(sessionId)
        ?? throw new NotFoundException("Die Session existiert nicht (mehr). Bitte die Datei erneut hochladen.");

    private static SheetData GetSheet(IntakeSession session, string sheetName) =>
        session.FindSheet(sheetName)
        ?? throw new NotFoundException($"Sheet '{sheetName}' existiert nicht.");

    private static CellRange ParseRange(string value)
    {
        if (!CellRange.TryParse(value, out var range))
            throw new ValidationException($"'{value}' ist keine gültige Range (Beispiel: A1:P30).");

        if (range.RowCount < 2)
            throw new ValidationException("Die Range muss mindestens eine Überschriftszeile und eine Datenzeile enthalten.");

        return range;
    }
}
