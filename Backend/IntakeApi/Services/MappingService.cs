using IntakeApi.Models;
using IntakeApi.Services.Interfaces;

namespace IntakeApi.Services;

/// <summary>
/// Mappt einen Bereich eines Sheets auf ein Zielformat.
///
/// Regeln:
///  1. Die erste Zeile der Extraction Range enthält die Spaltenüberschriften (Source-Spalten).
///  2. Eine Source-Spalte wird einer Zielspalte zugeordnet, wenn ihre Überschrift einem
///     der Aliase der Zielspalte entspricht (normalisierter Vergleich).
///  3. Jede Source-Spalte wird höchstens einer Zielspalte zugeordnet (erste passende gewinnt).
///  4. Source-Spalten ohne passende Zielspalte werden nicht übernommen.
///  5. Zielspalten ohne passende Source-Spalte bleiben leer (Überschrift bleibt erhalten).
///  6. Komplett leere Datenzeilen innerhalb der Range werden übersprungen.
/// </summary>
public class MappingService : IMappingService
{
    public MappingResult Map(SheetData sheet, CellRange range, TargetFormat format)
    {
        // 1. Source-Spalten (Überschriften) aus der ersten Zeile der Range lesen
        var sourceColumns = Enumerable.Range(range.StartColumn, range.ColumnCount)
            .Select(col => new
            {
                Index = col,
                Header = sheet.GetCell(range.StartRow, col),
                Letter = CellRange.ColumnIndexToLetter(col)
            })
            .Where(s => !string.IsNullOrWhiteSpace(s.Header))
            .ToList();

        // 2. Datenzeilen (ohne Überschrift, ohne komplett leere Zeilen).
        //    Zeilen unterhalb des letzten belegten Sheet-Inhalts sind immer leer und werden gar nicht erst geprüft.
        var lastDataRow = Math.Min(range.EndRow, sheet.RowCount - 1);
        var dataRowIndices = Enumerable.Range(range.StartRow + 1, Math.Max(0, lastDataRow - range.StartRow))
            .Where(r => Enumerable.Range(range.StartColumn, range.ColumnCount)
                .Any(c => !string.IsNullOrWhiteSpace(sheet.GetCell(r, c))))
            .ToList();

        // 3. Zuordnung Zielspalte -> Source-Spalte
        var usedSourceIndices = new HashSet<int>();
        var mappedColumns = new List<MappedColumn>();

        foreach (var target in format.Columns)
        {
            var aliases = target.SourceAliases.Append(target.Name).Select(Normalize).ToHashSet();
            var match = sourceColumns.FirstOrDefault(s =>
                !usedSourceIndices.Contains(s.Index) && aliases.Contains(Normalize(s.Header)));

            if (match is null)
            {
                // Keine passende Source-Spalte -> Spalte bleibt leer
                mappedColumns.Add(new MappedColumn
                {
                    TargetColumn = target.Name,
                    Source = null,
                    Values = dataRowIndices.Select(_ => string.Empty).ToList()
                });
                continue;
            }

            usedSourceIndices.Add(match.Index);
            mappedColumns.Add(new MappedColumn
            {
                TargetColumn = target.Name,
                Source = new SourceColumnInfo(match.Header, match.Letter),
                Values = dataRowIndices.Select(r => sheet.GetCell(r, match.Index)).ToList(),
                EditedRowIndices = dataRowIndices
                    .Select((sheetRow, i) => (sheetRow, i))
                    .Where(x => sheet.IsEdited(x.sheetRow, match.Index))
                    .Select(x => x.i)
                    .ToList()
            });
        }

        var unmapped = sourceColumns
            .Where(s => !usedSourceIndices.Contains(s.Index))
            .Select(s => new SourceColumnInfo(s.Header, s.Letter))
            .ToList();

        return new MappingResult
        {
            TargetFormatId = format.Id,
            TargetFormatName = format.Name,
            SheetName = sheet.Name,
            Range = range.ToString(),
            SourceRowIndices = dataRowIndices,
            Columns = mappedColumns,
            UnmappedSourceColumns = unmapped
        };
    }

    /// <summary>Vereinheitlicht Überschriften für den Vergleich ("Customer_Name " -> "customername").</summary>
    private static string Normalize(string value) =>
        new string(value.Where(ch => !char.IsWhiteSpace(ch) && ch != '_' && ch != '-' && ch != '.').ToArray())
            .ToLowerInvariant();
}
