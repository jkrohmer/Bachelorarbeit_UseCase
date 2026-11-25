// DTOs, wie sie vom Backend (IntakeApi) geliefert bzw. erwartet werden.

// ---------- Zustand einer Session ----------

/** Schritte des Ablaufs – entsprechen den Routen im Frontend (/upload, /extraction, ...). */
export type IntakeStep = 'upload' | 'extraction' | 'mapping' | 'preview';

/** Mögliche Schrittwechsel. */
export type IntakeAction = 'back' | 'next';

/** Vollständiger Zustand einer Session – Antwort auf Upload, Laden und jede Änderung. */
export interface IntakeState {
  sessionId: string;
  fileName: string;
  /** Aktueller Schritt – das Backend entscheidet über die Navigation. */
  currentStep: IntakeStep;
  /** Im aktuellen Schritt erlaubte Schrittwechsel. */
  availableActions: IntakeAction[];
  sheets: SheetInfo[];
  selectedSheet: string;
  range: string | null;
  targetFormatId: string | null;
  preview: SheetPreview;
  mapping: MappingResult | null;
  lastModifiedAt: string;
}

export interface SheetInfo {
  name: string;
  rowCount: number;
  columnCount: number;
}

export interface SheetPreview {
  name: string;
  totalRows: number;
  totalColumns: number;
  columnLetters: string[];
  rows: string[][];
  /** Adressen der manuell geänderten Zellen, z. B. "B5". */
  editedCells: string[];
}

// ---------- Änderungen (Deltas) ----------

/** Änderung der Konfiguration – nur gesetzte Felder werden übernommen. */
export interface IntakeUpdate {
  sheetName?: string;
  range?: string;
  targetFormatId?: string;
}

export interface CellUpdate {
  /** Zelladresse, z. B. "B5". */
  address: string;
  value: string;
}

export interface CellsUpdate {
  sheetName: string;
  cells: CellUpdate[];
}

// ---------- Target Formats ----------

export interface TargetColumn {
  name: string;
  sourceAliases: string[];
}

export interface TargetFormat {
  id: string;
  name: string;
  description: string;
  columns: TargetColumn[];
}

// ---------- Mapping ----------

export interface SourceColumn {
  header: string;
  columnLetter: string;
}

export interface MappedColumn {
  targetColumn: string;
  source: SourceColumn | null;
  values: string[];
  /** Indizes (bezogen auf values) der manuell geänderten Werte. */
  editedRows: number[];
}

export interface MappingResult {
  targetFormatId: string;
  targetFormatName: string;
  sheetName: string;
  range: string;
  rowCount: number;
  /** Excel-Zeilennummer (1-basiert) jeder Ergebniszeile. */
  sourceRowNumbers: number[];
  columns: MappedColumn[];
  unmappedSourceColumns: SourceColumn[];
}

export interface ApiError {
  message: string;
}
