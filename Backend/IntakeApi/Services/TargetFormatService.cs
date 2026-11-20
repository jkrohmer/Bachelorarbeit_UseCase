using IntakeApi.Models;
using IntakeApi.Services.Interfaces;

namespace IntakeApi.Services;

/// <summary>
/// Liefert die fest definierten Zielformate.
/// Die Spalten sind bewusst generisch gehalten und können später durch die echten ersetzt werden.
/// </summary>
public class TargetFormatService : ITargetFormatService
{
    private static readonly IReadOnlyList<TargetFormat> Formats = new List<TargetFormat>
    {
        new()
        {
            Id = "target-format-1",
            Name = "Target Format 1",
            Description = "Beispielformat für Stammdaten (ID, Name, Datum, Betrag, Status)",
            Columns =
            {
                new TargetColumn { Name = "ID",     SourceAliases = { "ID", "Nr", "Nummer", "Number" } },
                new TargetColumn { Name = "Name",   SourceAliases = { "Name", "Kunde", "Customer", "Bezeichnung" } },
                new TargetColumn { Name = "Datum",  SourceAliases = { "Datum", "Date" } },
                new TargetColumn { Name = "Betrag", SourceAliases = { "Betrag", "Amount", "Preis", "Price" } },
                new TargetColumn { Name = "Status", SourceAliases = { "Status", "State" } },
                new TargetColumn { Name = "Kommentar", SourceAliases = { "Kommentar", "Comment", "Bemerkung", "Notes" } },
            }
        },
        new()
        {
            Id = "target-format-2",
            Name = "Target Format 2",
            Description = "Beispielformat für Artikel (Code, Beschreibung, Menge, Einheit, Lager)",
            Columns =
            {
                new TargetColumn { Name = "Code",         SourceAliases = { "Code", "ID", "Artikelnummer", "Nr" } },
                new TargetColumn { Name = "Beschreibung", SourceAliases = { "Beschreibung", "Description", "Name", "Bezeichnung" } },
                new TargetColumn { Name = "Menge",        SourceAliases = { "Menge", "Quantity", "Anzahl", "Qty" } },
                new TargetColumn { Name = "Einheit",      SourceAliases = { "Einheit", "Unit" } },
                new TargetColumn { Name = "Lager",        SourceAliases = { "Lager", "Warehouse", "Ort", "Location" } },
            }
        }
    };

    public IReadOnlyList<TargetFormat> GetAll() => Formats;

    public TargetFormat? GetById(string id) =>
        Formats.FirstOrDefault(f => string.Equals(f.Id, id, StringComparison.OrdinalIgnoreCase));
}
