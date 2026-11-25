using IntakeApi.Exceptions;
using IntakeApi.Models;
using IntakeApi.Services.Interfaces;

namespace IntakeApi.Services;

/// <summary>
/// Legt den Ablauf der Schritte fest: Reihenfolge und Bedingungen für einen Schrittwechsel.
///
///   Upload -> Extraction -> Mapping -> Preview
///
/// Das Backend entscheidet damit über die Navigation – sowohl die UI als auch ein
/// headless Client (z. B. ein Agent) wechseln die Schritte ausschließlich über Next/Back.
/// Aktuell ein einfacher linearer Ablauf; kann später durch einen Workflow-Graphen
/// (z. B. ein Executor pro Schritt) ersetzt werden, ohne die API zu ändern.
/// </summary>
public class IntakeWorkflow : IIntakeWorkflow
{
    private static readonly IntakeStep[] Steps =
        [IntakeStep.Upload, IntakeStep.Extraction, IntakeStep.Mapping, IntakeStep.Preview];

    public IReadOnlyList<IntakeAction> GetAvailableActions(IntakeSession session, MappingResult? mapping)
    {
        var actions = new List<IntakeAction>();
        if (CheckBack(session) is null) actions.Add(IntakeAction.Back);
        if (CheckNext(session, mapping) is null) actions.Add(IntakeAction.Next);
        return actions;
    }

    public IntakeStep GetNextStep(IntakeSession session, MappingResult? mapping)
    {
        var reason = CheckNext(session, mapping);
        if (reason is not null) throw new ValidationException(reason);
        return Steps[IndexOf(session.CurrentStep) + 1];
    }

    public IntakeStep GetPreviousStep(IntakeSession session)
    {
        var reason = CheckBack(session);
        if (reason is not null) throw new ValidationException(reason);
        return Steps[IndexOf(session.CurrentStep) - 1];
    }

    /// <summary>Liefert den Grund, warum "Next" nicht möglich ist, oder null, wenn er erlaubt ist.</summary>
    private static string? CheckNext(IntakeSession session, MappingResult? mapping)
    {
        var index = IndexOf(session.CurrentStep);
        if (index == Steps.Length - 1)
            return "Der Ablauf ist bereits beim letzten Schritt.";

        // Ab dem Mapping-Schritt wird ein gültiges Mapping-Ergebnis benötigt
        var next = Steps[index + 1];
        if (next >= IntakeStep.Mapping && mapping is null)
            return "Extraction Range und Target Format müssen festgelegt sein, bevor das Mapping angezeigt werden kann.";

        return null;
    }

    /// <summary>Liefert den Grund, warum "Back" nicht möglich ist, oder null, wenn er erlaubt ist.</summary>
    private static string? CheckBack(IntakeSession session) =>
        IndexOf(session.CurrentStep) == 0 ? "Der Ablauf ist bereits beim ersten Schritt." : null;

    private static int IndexOf(IntakeStep step) => Array.IndexOf(Steps, step);
}
