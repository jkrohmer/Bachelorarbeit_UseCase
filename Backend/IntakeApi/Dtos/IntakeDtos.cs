namespace IntakeApi.Dtos;

// ---------- Schritt 1: Upload ----------

public record UploadResponseDto(
    Guid SessionId,
    string FileName,
    IReadOnlyList<SheetInfoDto> Sheets,
    string DefaultRange);

public record SheetInfoDto(string Name, int RowCount, int ColumnCount);

public record SheetPreviewDto(
    string Name,
    int TotalRows,
    int TotalColumns,
    IReadOnlyList<string> ColumnLetters,
    IReadOnlyList<IReadOnlyList<string>> Rows);

// ---------- Schritt 2: Extraction Range & Target Format ----------

public record ExtractionConfigDto(string SheetName, string Range, string TargetFormatId);

public record ExtractionConfigResponseDto(
    string SheetName,
    string Range,
    string TargetFormatId,
    int RowCount,
    int ColumnCount);

// ---------- Target Formats ----------

public record TargetFormatDto(
    string Id,
    string Name,
    string Description,
    IReadOnlyList<TargetColumnDto> Columns);

public record TargetColumnDto(string Name, IReadOnlyList<string> SourceAliases);

// ---------- Schritt 3/4: Mapping & Preview ----------

public record MappingResultDto(
    string TargetFormatId,
    string TargetFormatName,
    string SheetName,
    string Range,
    int RowCount,
    IReadOnlyList<MappedColumnDto> Columns,
    IReadOnlyList<SourceColumnDto> UnmappedSourceColumns);

public record MappedColumnDto(
    string TargetColumn,
    SourceColumnDto? Source,
    IReadOnlyList<string> Values);

public record SourceColumnDto(string Header, string ColumnLetter);

// ---------- Fehler ----------

public record ErrorResponseDto(string Message);
