using IntakeApi.Models;

namespace IntakeApi.Dtos;

/// <summary>
/// Wandelt Domain-Models in DTOs für die API-Antworten um.
/// </summary>
public static class DtoMapper
{
    public static SheetInfoDto ToInfoDto(this SheetData sheet) =>
        new(sheet.Name, sheet.RowCount, sheet.ColumnCount);

    public static TargetFormatDto ToDto(this TargetFormat format) =>
        new(format.Id,
            format.Name,
            format.Description,
            format.Columns.Select(c => new TargetColumnDto(c.Name, c.SourceAliases)).ToList());

    public static SourceColumnDto ToDto(this SourceColumnInfo source) =>
        new(source.Header, source.ColumnLetter);

    public static MappingResultDto ToDto(this MappingResult result) =>
        new(result.TargetFormatId,
            result.TargetFormatName,
            result.SheetName,
            result.Range,
            result.RowCount,
            result.Columns.Select(c => new MappedColumnDto(c.TargetColumn, c.Source?.ToDto(), c.Values)).ToList(),
            result.UnmappedSourceColumns.Select(s => s.ToDto()).ToList());
}
