import { NgClass } from '@angular/common';
import { Component, input } from '@angular/core';
import { SheetPreview } from '../../../core/models/intake.models';
import { CellRange } from '../../../core/utils/cell-range';

/**
 * Excel-ähnliche Vorschau eines Sheets (Spaltenbuchstaben + Zeilennummern).
 * Optional wird eine Extraction Range als Rahmen hervorgehoben.
 */
@Component({
  selector: 'app-sheet-preview',
  imports: [NgClass],
  templateUrl: './sheet-preview.component.html',
  styleUrl: './sheet-preview.component.scss',
})
export class SheetPreviewComponent {
  readonly preview = input.required<SheetPreview>();
  readonly highlightRange = input<CellRange | null>(null);

  inRange(row: number, col: number): boolean {
    const r = this.highlightRange();
    return !!r && row >= r.startRow && row <= r.endRow && col >= r.startColumn && col <= r.endColumn;
  }

  /** CSS-Klassen für den Rahmen um die Extraction Range. */
  borderClasses(row: number, col: number): Record<string, boolean> {
    const r = this.highlightRange();
    if (!r || !this.inRange(row, col)) return {};
    return {
      'cell--in-range': true,
      'cell--header-row': row === r.startRow,
      'cell--edge-top': row === r.startRow,
      'cell--edge-bottom': row === r.endRow,
      'cell--edge-left': col === r.startColumn,
      'cell--edge-right': col === r.endColumn,
    };
  }

  isColumnInRange(col: number): boolean {
    const r = this.highlightRange();
    return !!r && col >= r.startColumn && col <= r.endColumn;
  }

  isRowInRange(row: number): boolean {
    const r = this.highlightRange();
    return !!r && row >= r.startRow && row <= r.endRow;
  }
}
