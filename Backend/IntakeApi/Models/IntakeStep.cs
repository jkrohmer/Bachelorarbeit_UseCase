namespace IntakeApi.Models;

/// <summary>Schritte des Intake-Ablaufs in ihrer Reihenfolge.</summary>
public enum IntakeStep
{
    Upload,
    Extraction,
    Mapping,
    Preview
}

/// <summary>Aktionen, mit denen zwischen den Schritten gewechselt wird.</summary>
public enum IntakeAction
{
    Back,
    Next
}
