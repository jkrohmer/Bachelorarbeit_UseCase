namespace IntakeApi.Models;

/// <summary>
/// Hält den Zustand eines Intake-Vorgangs (hochgeladene Datei, Konfiguration, Ergebnis).
/// Wird im Arbeitsspeicher gehalten (siehe <c>InMemorySessionStore</c>).
/// </summary>
public class IntakeSession
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string FileName { get; init; }
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;

    public List<SheetData> Sheets { get; init; } = new();

    // Konfiguration aus Schritt 2 (Extraction Range & Target Format)
    public string? SelectedSheet { get; set; }
    public CellRange? ExtractionRange { get; set; }
    public string? TargetFormatId { get; set; }

    // Ergebnis aus Schritt 3 (Mapping)
    public MappingResult? MappingResult { get; set; }

    public SheetData? FindSheet(string name) =>
        Sheets.FirstOrDefault(s => string.Equals(s.Name, name, StringComparison.OrdinalIgnoreCase));
}
