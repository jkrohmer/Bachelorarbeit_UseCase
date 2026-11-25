namespace IntakeApi.Dtos;

// ---------- Zustand einer Session (Antwort auf jede Anfrage) ----------

/// <summary>
/// Vollständiger, aktueller Zustand einer Intake-Session. Wird nach Upload, Laden und
/// jeder Änderung zurückgegeben, damit das Frontend immer den Stand des Backends anzeigt.
/// </summary>
public record IntakeStateDto(
    Guid SessionId,
    string FileName,
    IReadOnlyList<SheetInfoDto> Sheets,
    string SelectedSheet,
    string? Range,
    string? TargetFormatId,
    SheetPreviewDto Preview,
    MappingResultDto? Mapping,
    DateTime LastModifiedAt);

public record SheetInfoDto(string Name, int RowCount, int ColumnCount);

public record SheetPreviewDto(
    string Name,
    int TotalRows,
    int TotalColumns,
    IReadOnlyList<string> ColumnLetters,
    IReadOnlyList<IReadOnlyList<string>> Rows,
    IReadOnlyList<string> EditedCells);

// ---------- Änderungen (Deltas) ----------

/// <summary>
/// Änderung der Konfiguration. Nur die gesetzten Felder werden übernommen,
/// nicht gesetzte (null) Felder bleiben unverändert.
/// </summary>
public record IntakeUpdateDto(string? SheetName, string? Range, string? TargetFormatId);

/// <summary>Änderung einzelner Zellen eines Sheets.</summary>
public record CellsUpdateDto(string SheetName, IReadOnlyList<CellUpdateDto> Cells);

/// <summary>Neuer Wert für eine Zelle, z. B. Address = "B5".</summary>
public record CellUpdateDto(string Address, string? Value);

// ---------- Target Formats ----------

public record TargetFormatDto(
    string Id,
    string Name,
    string Description,
    IReadOnlyList<TargetColumnDto> Columns);

public record TargetColumnDto(string Name, IReadOnlyList<string> SourceAliases);

// ---------- Mapping ----------

public record MappingResultDto(
    string TargetFormatId,
    string TargetFormatName,
    string SheetName,
    string Range,
    int RowCount,
    IReadOnlyList<int> SourceRowNumbers,
    IReadOnlyList<MappedColumnDto> Columns,
    IReadOnlyList<SourceColumnDto> UnmappedSourceColumns);

public record MappedColumnDto(
    string TargetColumn,
    SourceColumnDto? Source,
    IReadOnlyList<string> Values,
    IReadOnlyList<int> EditedRows);

public record SourceColumnDto(string Header, string ColumnLetter);

// ---------- Fehler ----------

public record ErrorResponseDto(string Message);
