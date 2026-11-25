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
2. **Extraction Range** – Bereich festlegen (Standard `A1:P30`), Sheet und Target Format wählen. Die Range wird in der Vorschau als Rahmen angezeigt. Zellen der Vorschau lassen sich per Doppelklick bearbeiten.
3. **Mapping** – Pro Zielspalte sieht man, aus welcher Source-Spalte (Überschrift + Spaltenbuchstabe) die Werte kommen. Zielspalten ohne passende Quelle bleiben leer; nicht passende Source-Spalten werden nicht übernommen. Werte lassen sich per Doppelklick korrigieren; geänderte Zellen sind gelb markiert.
4. **Preview** – Vorschau des Ergebnisses und Button „Download Excel File“.

### Zustand im Backend

Der komplette Zustand einer Session liegt im Backend – das Frontend speichert nur die Session-ID.

- Jede Änderung in der UI (Sheet, Range, Target Format, Zellwert) wird **sofort** an das Backend geschickt.
- Geschickt wird nur das **Delta**, also das, was sich geändert hat (`PATCH`).
- Das Backend antwortet mit dem **vollständigen neuen Zustand** (Konfiguration, Sheet-Vorschau, neu berechnetes Mapping),
  den das Frontend direkt anzeigt.
- Änderungen werden im Frontend in einer Warteschlange nacheinander gesendet, damit die Reihenfolge erhalten bleibt.
- Zellen werden immer in der Ursprungsdatei geändert (Adresse z. B. `B5`); der Originalwert bleibt gespeichert,
  sodass geänderte Zellen erkennbar sind. Wird der Originalwert wieder eingetragen, gilt die Zelle als unverändert.

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
| POST  | `/api/intake/upload` | Excel-Datei hochladen (multipart, Feld `file`), legt eine Session an |
| GET   | `/api/intake/{id}` | Aktuellen Zustand der Session abrufen (z. B. nach Reload) |
| PATCH | `/api/intake/{id}` | Konfiguration ändern – Delta, z. B. `{ "range": "A1:F20" }` oder `{ "targetFormatId": "target-format-2" }` |
| PATCH | `/api/intake/{id}/cells` | Zellen ändern – z. B. `{ "sheetName": "Kunden", "cells": [{ "address": "B5", "value": "Neu" }] }` |
| GET   | `/api/intake/{id}/download` | Mapping-Ergebnis des aktuellen Zustands als .xlsx herunterladen |
| GET  | `/api/target-formats` | verfügbare Zielformate |

Alle Intake-Endpunkte (außer Download) antworten mit dem vollständigen Session-Zustand.

Sessions werden im Arbeitsspeicher gehalten – nach einem Neustart des Backends muss die Datei neu hochgeladen werden.
Sessions, die 2 Stunden nicht geändert wurden, werden automatisch entfernt.
