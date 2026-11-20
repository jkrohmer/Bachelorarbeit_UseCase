using ClosedXML.Excel;
using IntakeApi.Exceptions;
using IntakeApi.Models;
using IntakeApi.Services.Interfaces;

namespace IntakeApi.Services;

/// <summary>
/// Liest alle Sheets einer .xlsx-Datei mit ClosedXML ein.
/// Jede Zelle wird als formatierter Text (so wie in Excel angezeigt) übernommen.
/// </summary>
public class ExcelReaderService : IExcelReaderService
{
    public List<SheetData> ReadWorkbook(Stream stream)
    {
        XLWorkbook workbook;
        try
        {
            workbook = new XLWorkbook(stream);
        }
        catch (Exception)
        {
            throw new ValidationException("Die Datei konnte nicht als Excel-Datei (.xlsx) gelesen werden.");
        }

        using (workbook)
        {
            return workbook.Worksheets.Select(ReadSheet).ToList();
        }
    }

    private static SheetData ReadSheet(IXLWorksheet worksheet)
    {
        var sheet = new SheetData { Name = worksheet.Name };

        var lastCell = worksheet.LastCellUsed();
        if (lastCell is null)
        {
            return sheet; // leeres Sheet
        }

        var lastRow = lastCell.Address.RowNumber;
        var lastColumn = worksheet.LastColumnUsed()?.ColumnNumber() ?? lastCell.Address.ColumnNumber;

        for (var r = 1; r <= lastRow; r++)
        {
            var row = new List<string>(lastColumn);
            for (var c = 1; c <= lastColumn; c++)
            {
                row.Add(ReadCellValue(worksheet.Cell(r, c)));
            }
            sheet.Rows.Add(row);
        }

        return sheet;
    }

    private static string ReadCellValue(IXLCell cell)
    {
        try
        {
            return cell.GetFormattedString().Trim();
        }
        catch
        {
            // z. B. bei nicht auswertbaren Formeln
            return cell.CachedValue.ToString()?.Trim() ?? string.Empty;
        }
    }
}
