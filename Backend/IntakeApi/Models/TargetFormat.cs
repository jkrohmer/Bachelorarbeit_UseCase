namespace IntakeApi.Models;

/// <summary>
/// Zielformat, auf das die Daten einer Excel-Datei gemappt werden.
/// </summary>
public class TargetFormat
{
    public required string Id { get; init; }
    public required string Name { get; init; }
    public string Description { get; init; } = string.Empty;
    public List<TargetColumn> Columns { get; init; } = new();
}

/// <summary>
/// Eine Spalte im Zielformat. Die feste Mapping-Regel: eine Source-Spalte wird dieser
/// Zielspalte zugeordnet, wenn ihre Überschrift einem der <see cref="SourceAliases"/> entspricht
/// (Groß-/Kleinschreibung, Leerzeichen, '_' und '-' werden ignoriert).
/// </summary>
public class TargetColumn
{
    public required string Name { get; init; }
    public List<string> SourceAliases { get; init; } = new();
}
