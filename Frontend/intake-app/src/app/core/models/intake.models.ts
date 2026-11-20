// DTOs, wie sie vom Backend (IntakeApi) geliefert werden.

export interface SheetInfo {
  name: string;
  rowCount: number;
  columnCount: number;
}

export interface UploadResponse {
  sessionId: string;
  fileName: string;
  sheets: SheetInfo[];
  defaultRange: string;
}

export interface SheetPreview {
  name: string;
  totalRows: number;
  totalColumns: number;
  columnLetters: string[];
  rows: string[][];
}

export interface ExtractionConfig {
  sheetName: string;
  range: string;
  targetFormatId: string;
}

export interface ExtractionConfigResponse extends ExtractionConfig {
  rowCount: number;
  columnCount: number;
}

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

export interface SourceColumn {
  header: string;
  columnLetter: string;
}

export interface MappedColumn {
  targetColumn: string;
  source: SourceColumn | null;
  values: string[];
}

export interface MappingResult {
  targetFormatId: string;
  targetFormatName: string;
  sheetName: string;
  range: string;
  rowCount: number;
  columns: MappedColumn[];
  unmappedSourceColumns: SourceColumn[];
}

export interface ApiError {
  message: string;
}
