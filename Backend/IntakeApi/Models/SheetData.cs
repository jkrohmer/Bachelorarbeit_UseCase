namespace IntakeApi.Models;

/// <summary>
/// Inhalt eines einzelnen Excel-Sheets. Zellen werden als formatierter Text gespeichert.
/// Rows[zeile][spalte], 0-basiert (Rows[0][0] entspricht Zelle A1).
/// </summary>
public class SheetData
{
    public required string Name { get; init; }

    public List<List<string>> Rows { get; init; } = new();

    public int RowCount => Rows.Count;

    public int ColumnCount => Rows.Count == 0 ? 0 : Rows.Max(r => r.Count);

    /// <summary>Liefert den Zellwert oder einen leeren String, falls die Zelle außerhalb liegt.</summary>
    public string GetCell(int rowIndex, int columnIndex)
    {
        if (rowIndex < 0 || rowIndex >= Rows.Count) return string.Empty;
        var row = Rows[rowIndex];
        return columnIndex >= 0 && columnIndex < row.Count ? row[columnIndex] : string.Empty;
    }
}
