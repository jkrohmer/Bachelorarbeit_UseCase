/** Zellbereich mit 0-basierten, inklusiven Indizes. */
export interface CellRange {
  startRow: number;
  startColumn: number;
  endRow: number;
  endColumn: number;
}

const CELL_REGEX = /^\s*([A-Za-z]{1,3})(\d{1,7})\s*$/;

/** "A" -> 0, "AA" -> 26 */
export function letterToColumnIndex(letters: string): number {
  return letters
    .toUpperCase()
    .split('')
    .reduce((acc, ch) => acc * 26 + (ch.charCodeAt(0) - 64), 0) - 1;
}

/** 0 -> "A", 26 -> "AA" */
export function columnIndexToLetter(index: number): string {
  let n = index + 1;
  let result = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

/** Parst eine einzelne Zelle wie "B3" -> { row: 2, column: 1 } */
export function parseCell(value: string): { row: number; column: number } | null {
  const match = CELL_REGEX.exec(value ?? '');
  if (!match) return null;
  const row = parseInt(match[2], 10) - 1;
  if (row < 0) return null;
  return { row, column: letterToColumnIndex(match[1]) };
}

/** Parst "A1:P30" in einen normalisierten Bereich. */
export function parseRange(value: string): CellRange | null {
  const parts = (value ?? '').split(':');
  if (parts.length !== 2) return null;
  const start = parseCell(parts[0]);
  const end = parseCell(parts[1]);
  if (!start || !end) return null;
  return {
    startRow: Math.min(start.row, end.row),
    startColumn: Math.min(start.column, end.column),
    endRow: Math.max(start.row, end.row),
    endColumn: Math.max(start.column, end.column),
  };
}

export function formatRange(range: CellRange): string {
  return `${columnIndexToLetter(range.startColumn)}${range.startRow + 1}:` +
    `${columnIndexToLetter(range.endColumn)}${range.endRow + 1}`;
}
