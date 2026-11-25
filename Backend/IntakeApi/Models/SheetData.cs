namespace IntakeApi.Models;

/// <summary>
/// Inhalt eines einzelnen Excel-Sheets. Zellen werden als formatierter Text gespeichert.
/// Rows[zeile][spalte], 0-basiert (Rows[0][0] entspricht Zelle A1).
///
/// Zellen können nachträglich geändert werden (<see cref="SetCell"/>). Der ursprüngliche
/// Wert aus der hochgeladenen Datei bleibt dabei erhalten, sodass jederzeit erkennbar ist,
/// welche Zellen manuell angepasst wurden.
/// </summary>
public class SheetData
{
    public required string Name { get; init; }

    public List<List<string>> Rows { get; init; } = new();

    /// <summary>Ursprüngliche Werte aller geänderten Zellen, Schlüssel = (Zeile, Spalte).</summary>
    private readonly Dictionary<(int Row, int Column), string> _originalValues = new();

    public int RowCount => Rows.Count;

    public int ColumnCount => Rows.Count == 0 ? 0 : Rows.Max(r => r.Count);

    /// <summary>Alle aktuell geänderten Zellen (0-basiert).</summary>
    public IEnumerable<(int Row, int Column)> EditedCells => _originalValues.Keys;

    /// <summary>Liefert den Zellwert oder einen leeren String, falls die Zelle außerhalb liegt.</summary>
    public string GetCell(int rowIndex, int columnIndex)
    {
        if (rowIndex < 0 || rowIndex >= Rows.Count) return string.Empty;
        var row = Rows[rowIndex];
        return columnIndex >= 0 && columnIndex < row.Count ? row[columnIndex] : string.Empty;
    }

    /// <summary>
    /// Setzt einen Zellwert. Liegt die Zelle außerhalb der bisherigen Daten, wird das Sheet erweitert.
    /// Wird eine Zelle auf ihren Originalwert zurückgesetzt, gilt sie nicht mehr als geändert.
    /// </summary>
    public void SetCell(int rowIndex, int columnIndex, string value)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(rowIndex);
        ArgumentOutOfRangeException.ThrowIfNegative(columnIndex);

        var key = (rowIndex, columnIndex);
        var current = GetCell(rowIndex, columnIndex);
        if (current == value) return;

        if (!_originalValues.TryGetValue(key, out var original))
        {
            _originalValues[key] = current;
        }
        else if (original == value)
        {
            _originalValues.Remove(key);
        }

        while (Rows.Count <= rowIndex) Rows.Add(new List<string>());
        var row = Rows[rowIndex];
        while (row.Count <= columnIndex) row.Add(string.Empty);
        row[columnIndex] = value;
    }

    public bool IsEdited(int rowIndex, int columnIndex) => _originalValues.ContainsKey((rowIndex, columnIndex));
}
