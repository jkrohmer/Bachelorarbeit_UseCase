namespace IntakeApi.Exceptions;

/// <summary>Wird geworfen, wenn eine angefragte Ressource (Session, Sheet, Format ...) nicht existiert.</summary>
public class NotFoundException(string message) : Exception(message);

/// <summary>Wird geworfen, wenn eine Anfrage fachlich ungültig ist (falsche Range, fehlende Konfiguration ...).</summary>
public class ValidationException(string message) : Exception(message);
