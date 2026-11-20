# Bachelorarbeit_UseCase – Excel Intake

Vereinfachter Nachbau einer Intake-Anwendung: Eine Excel-Datei wird hochgeladen, ein Bereich
(Extraction Range) ausgewählt, die Spalten werden nach festen Regeln auf ein Zielformat gemappt
und das Ergebnis als Excel-Datei heruntergeladen.

| Teil     | Technologie                         | Ordner                   |
|----------|-------------------------------------|--------------------------|
| Backend  | .NET 10, ASP.NET Core Web API, C#, ClosedXML | `Backend/IntakeApi`  |
| Frontend | Angular 19 (TypeScript, HTML, SCSS) | `Frontend/intake-app`    |
| Testdaten| Beispiel-Excel-Dateien              | `SampleData`             |

## Starten

**Backend** (läuft auf http://localhost:5112):

```powershell
cd Backend/IntakeApi
dotnet run --launch-profile http
```

**Frontend** (läuft auf http://localhost:4200, `/api` wird per Proxy an das Backend weitergeleitet):

```powershell
cd Frontend/intake-app
npm install     # nur beim ersten Mal
npm start
```

Danach http://localhost:4200 im Browser öffnen.


## Ablauf (4 Schritte)

1. **Upload** – Excel-Datei (.xlsx/.xlsm) hochladen, Vorschau ansehen, Sheet über das Dropdown rechts wechseln. „Start“ unten rechts.
2. **Extraction Range** – Bereich festlegen (Standard `A1:P30`), Sheet und Target Format wählen. Die Range wird in der Vorschau als Rahmen angezeigt. „Next“ speichert die Konfiguration und führt das Mapping aus.
3. **Mapping** – Pro Zielspalte sieht man, aus welcher Source-Spalte (Überschrift + Spaltenbuchstabe) die Werte kommen. Zielspalten ohne passende Quelle bleiben leer; nicht passende Source-Spalten werden nicht übernommen.
4. **Preview** – Vorschau des Ergebnisses und Button „Download Excel File“.

### Mapping-Regel

- Die **erste Zeile der Extraction Range** enthält die Überschriften (Source-Spalten).
- Jede Zielspalte hat eine Liste von Aliassen (z. B. `Name` ← `Name, Kunde, Customer, Bezeichnung`).
  Eine Source-Spalte wird zugeordnet, wenn ihre Überschrift einem Alias entspricht
  (ohne Groß-/Kleinschreibung, Leerzeichen, `_`, `-`, `.`).
- Komplett leere Zeilen in der Range werden übersprungen.

Die Zielformate sind in `Backend/IntakeApi/Services/TargetFormatService.cs` definiert,
die Standard-Range in `Backend/IntakeApi/appsettings.json` (`Intake:DefaultExtractionRange`).

## Projektstruktur

```
Backend/IntakeApi
├── Controllers/        IntakeController, TargetFormatsController
├── Dtos/               Request-/Response-Objekte + Mapper Model -> DTO
├── Models/             SheetData, CellRange, TargetFormat, MappingResult, IntakeSession
├── Services/           ExcelReader, ExcelExport, Mapping, TargetFormat, SessionStore, IntakeService
│   └── Interfaces/
├── Configuration/      IntakeOptions (appsettings)
├── Exceptions/         NotFound-/ValidationException
├── Middleware/         zentrales Exception-Handling -> HTTP-Statuscodes
└── Program.cs          DI, CORS, Pipeline

Frontend/intake-app/src
├── app/core/           models, services (API, State), guards, utils
├── app/shared/         stepper, sheet-preview, mapped-table
├── app/pages/          upload, extraction, mapping, result-preview
├── environments/
└── styles/             SCSS-Variablen
```

## API-Endpunkte

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| POST | `/api/intake/upload` | Excel-Datei hochladen (multipart, Feld `file`) |
| GET  | `/api/intake/{id}/sheets/{sheet}?range=` | Vorschau eines Sheets |
| PUT  | `/api/intake/{id}/extraction` | Sheet, Range und Target Format speichern |
| POST | `/api/intake/{id}/mapping` | Mapping ausführen |
| GET  | `/api/intake/{id}/result` | Mapping-Ergebnis abrufen |
| GET  | `/api/intake/{id}/download` | Ergebnis als .xlsx herunterladen |
| GET  | `/api/target-formats` | verfügbare Zielformate |

Sessions werden im Arbeitsspeicher gehalten – nach einem Neustart des Backends muss die Datei neu hochgeladen werden.
