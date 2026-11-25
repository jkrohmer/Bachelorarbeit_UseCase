namespace IntakeApi.Models;

/// <summary>
/// Ergebnis eines Mapping-Laufs: eine Liste von Zielspalten inkl. Werten.
/// </summary>
public class MappingResult
{
    public required string TargetFormatId { get; init; }
    public required string TargetFormatName { get; init; }
    public required string SheetName { get; init; }
    public required string Range { get; init; }
    public int RowCount => SourceRowIndices.Count;

    /// <summary>
    /// Für jede Ergebniszeile der Zeilenindex im Sheet (0-basiert). Damit lässt sich jede
    /// Ergebniszelle eindeutig auf ihre Ursprungszelle zurückführen (z. B. zum Bearbeiten).
    /// </summary>
    public List<int> SourceRowIndices { get; init; } = new();

    public List<MappedColumn> Columns { get; init; } = new();

    /// <summary>Source-Spalten, die keiner Zielspalte zugeordnet werden konnten.</summary>
    public List<SourceColumnInfo> UnmappedSourceColumns { get; init; } = new();
}

public class MappedColumn
{
    public required string TargetColumn { get; init; }

    /// <summary>Herkunft der Daten; null, wenn keine passende Source-Spalte gefunden wurde.</summary>
    public SourceColumnInfo? Source { get; init; }

    public List<string> Values { get; init; } = new();

    /// <summary>Indizes (bezogen auf <see cref="Values"/>) der Werte, die manuell geändert wurden.</summary>
    public List<int> EditedRowIndices { get; init; } = new();
}

public record SourceColumnInfo(string Header, string ColumnLetter);
