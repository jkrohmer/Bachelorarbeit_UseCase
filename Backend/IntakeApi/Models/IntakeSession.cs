namespace IntakeApi.Models;

/// <summary>
/// Hält den vollständigen Zustand eines Intake-Vorgangs: hochgeladene (und ggf. bearbeitete)
/// Sheets sowie die aktuelle Konfiguration. Das Backend ist die einzige Quelle der Wahrheit –
/// jede Änderung im Frontend wird sofort hierher übertragen.
/// Das Mapping-Ergebnis wird nicht gespeichert, sondern bei Bedarf aus diesem Zustand berechnet.
/// Wird im Arbeitsspeicher gehalten (siehe <c>InMemorySessionStore</c>).
/// </summary>
public class IntakeSession
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string FileName { get; init; }
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    public DateTime LastModifiedAt { get; private set; } = DateTime.UtcNow;

    public List<SheetData> Sheets { get; init; } = new();

    // Konfiguration (Schritt 1 und 2)
    public required string SelectedSheet { get; set; }
    public CellRange? ExtractionRange { get; set; }
    public string? TargetFormatId { get; set; }

    /// <summary>Sperrobjekt, damit parallele Änderungen an derselben Session sich nicht überschneiden.</summary>
    public object SyncRoot { get; } = new();

    public SheetData? FindSheet(string name) =>
        Sheets.FirstOrDefault(s => string.Equals(s.Name, name, StringComparison.OrdinalIgnoreCase));

    /// <summary>Markiert die Session als geändert (verlängert gleichzeitig ihre Lebensdauer).</summary>
    public void Touch() => LastModifiedAt = DateTime.UtcNow;
}
