using System.Text.RegularExpressions;

namespace IntakeApi.Models;

/// <summary>
/// Rechteckiger Zellbereich (z. B. "A1:P30"). Alle Indizes sind 0-basiert und inklusive.
/// </summary>
public partial record CellRange(int StartRow, int StartColumn, int EndRow, int EndColumn)
{
    public int RowCount => EndRow - StartRow + 1;
    public int ColumnCount => EndColumn - StartColumn + 1;

    public string StartCell => $"{ColumnIndexToLetter(StartColumn)}{StartRow + 1}";
    public string EndCell => $"{ColumnIndexToLetter(EndColumn)}{EndRow + 1}";

    public override string ToString() => $"{StartCell}:{EndCell}";

    [GeneratedRegex(@"^\s*([A-Za-z]{1,3})(\d{1,7})\s*:\s*([A-Za-z]{1,3})(\d{1,7})\s*$")]
    private static partial Regex RangeRegex();

    public static bool TryParse(string? value, out CellRange range)
    {
        range = default!;
        if (string.IsNullOrWhiteSpace(value)) return false;

        var match = RangeRegex().Match(value);
        if (!match.Success) return false;

        var startCol = LetterToColumnIndex(match.Groups[1].Value);
        var startRow = int.Parse(match.Groups[2].Value) - 1;
        var endCol = LetterToColumnIndex(match.Groups[3].Value);
        var endRow = int.Parse(match.Groups[4].Value) - 1;

        if (startRow < 0 || endRow < 0) return false;

        // Bereich normalisieren, falls Start und Ende vertauscht angegeben wurden
        range = new CellRange(
            Math.Min(startRow, endRow), Math.Min(startCol, endCol),
            Math.Max(startRow, endRow), Math.Max(startCol, endCol));
        return true;
    }

    [GeneratedRegex(@"^\s*([A-Za-z]{1,3})(\d{1,7})\s*$")]
    private static partial Regex CellRegex();

    /// <summary>Parst eine einzelne Zelladresse wie "B5" in 0-basierte Indizes (Zeile 4, Spalte 1).</summary>
    public static bool TryParseCell(string? value, out int row, out int column)
    {
        row = column = -1;
        if (string.IsNullOrWhiteSpace(value)) return false;

        var match = CellRegex().Match(value);
        if (!match.Success) return false;

        row = int.Parse(match.Groups[2].Value) - 1;
        column = LetterToColumnIndex(match.Groups[1].Value);
        return row >= 0;
    }

    /// <summary>0-basierte Indizes -> Zelladresse, z. B. (4, 1) -> "B5".</summary>
    public static string ToAddress(int row, int column) => $"{ColumnIndexToLetter(column)}{row + 1}";

    /// <summary>0 -> "A", 25 -> "Z", 26 -> "AA"</summary>
    public static string ColumnIndexToLetter(int index)
    {
        var result = string.Empty;
        var n = index + 1;
        while (n > 0)
        {
            var rem = (n - 1) % 26;
            result = (char)('A' + rem) + result;
            n = (n - 1) / 26;
        }
        return result;
    }

    /// <summary>"A" -> 0, "Z" -> 25, "AA" -> 26</summary>
    public static int LetterToColumnIndex(string letters)
    {
        var result = 0;
        foreach (var c in letters.ToUpperInvariant())
        {
            result = result * 26 + (c - 'A' + 1);
        }
        return result - 1;
    }
}
