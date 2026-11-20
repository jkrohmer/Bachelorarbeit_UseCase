namespace IntakeApi.Configuration;

/// <summary>
/// Einstellungen aus appsettings.json (Abschnitt "Intake").
/// </summary>
public class IntakeOptions
{
    public const string SectionName = "Intake";

    /// <summary>Standard-Extraction-Range, die für jede Excel-Datei vorgeschlagen wird.</summary>
    public string DefaultExtractionRange { get; set; } = "A1:P30";

    /// <summary>Maximale Anzahl Zeilen, die in der Vorschau ausgeliefert werden.</summary>
    public int PreviewMaxRows { get; set; } = 200;

    /// <summary>Maximale Anzahl Spalten, die in der Vorschau ausgeliefert werden.</summary>
    public int PreviewMaxColumns { get; set; } = 52;

    /// <summary>Maximale Upload-Größe in MB.</summary>
    public int MaxUploadSizeMb { get; set; } = 20;
}
