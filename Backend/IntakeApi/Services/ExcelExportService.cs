using ClosedXML.Excel;
using IntakeApi.Models;
using IntakeApi.Services.Interfaces;

namespace IntakeApi.Services;

/// <summary>
/// Schreibt das Mapping-Ergebnis in eine neue .xlsx-Datei
/// (Zeile 1 = Zielspalten-Überschriften, darunter die Werte).
/// </summary>
public class ExcelExportService : IExcelExportService
{
    public byte[] CreateWorkbook(MappingResult result)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add(SanitizeSheetName(result.TargetFormatName));

        for (var c = 0; c < result.Columns.Count; c++)
        {
            var column = result.Columns[c];
            var header = sheet.Cell(1, c + 1);
            header.Value = column.TargetColumn;
            header.Style.Font.Bold = true;
            header.Style.Fill.BackgroundColor = XLColor.FromHtml("#DDE7F5");

            for (var r = 0; r < column.Values.Count; r++)
            {
                sheet.Cell(r + 2, c + 1).Value = column.Values[r];
            }
        }

        sheet.SheetView.FreezeRows(1);
        sheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    private static string SanitizeSheetName(string name)
    {
        var invalid = new[] { ':', '\\', '/', '?', '*', '[', ']' };
        var cleaned = new string(name.Where(ch => !invalid.Contains(ch)).ToArray()).Trim();
        if (string.IsNullOrEmpty(cleaned)) cleaned = "Result";
        return cleaned.Length > 31 ? cleaned[..31] : cleaned;
    }
}
