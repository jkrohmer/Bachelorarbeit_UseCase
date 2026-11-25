import { NgClass } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import { CellUpdate, SheetPreview } from '../../../core/models/intake.models';
import { CellRange } from '../../../core/utils/cell-range';
import { AutoFocusDirective } from '../../directives/auto-focus.directive';

/**
 * Excel-ähnliche Vorschau eines Sheets (Spaltenbuchstaben + Zeilennummern).
 * Optional wird eine Extraction Range als Rahmen hervorgehoben.
 * Mit editable = true lassen sich Zellen per Doppelklick bearbeiten (Enter = speichern, Esc = abbrechen);
 * jede Änderung wird über cellEdit gemeldet.
 */
@Component({
  selector: 'app-sheet-preview',
  imports: [NgClass, AutoFocusDirective],
  templateUrl: './sheet-preview.component.html',
  styleUrl: './sheet-preview.component.scss',
})
export class SheetPreviewComponent {
  readonly preview = input.required<SheetPreview>();
  readonly highlightRange = input<CellRange | null>(null);
  readonly editable = input<boolean>(false);

  readonly cellEdit = output<CellUpdate>();

  /** Zelle, die gerade bearbeitet wird. */
  readonly editing = signal<{ row: number; column: number } | null>(null);

  private readonly editedCells = computed(() => new Set(this.preview().editedCells));

  address(row: number, col: number): string {
    return `${this.preview().columnLetters[col]}${row + 1}`;
  }

  isEditing(row: number, col: number): boolean {
    const e = this.editing();
    return !!e && e.row === row && e.column === col;
  }

  startEdit(row: number, col: number): void {
    if (this.editable()) this.editing.set({ row, column: col });
  }

  commitEdit(row: number, col: number, value: string): void {
    if (!this.isEditing(row, col)) return; // z. B. blur nach Enter
    this.editing.set(null);
    if (value !== this.preview().rows[row][col]) {
      this.cellEdit.emit({ address: this.address(row, col), value });
    }
  }

  cancelEdit(): void {
    this.editing.set(null);
  }

  inRange(row: number, col: number): boolean {
    const r = this.highlightRange();
    return !!r && row >= r.startRow && row <= r.endRow && col >= r.startColumn && col <= r.endColumn;
  }

  /** CSS-Klassen für Rahmen der Extraction Range und geänderte Zellen. */
  cellClasses(row: number, col: number): Record<string, boolean> {
    const classes: Record<string, boolean> = {
      'cell--edited': this.editedCells().has(this.address(row, col)),
      'cell--editable': this.editable(),
    };

    const r = this.highlightRange();
    if (!r || !this.inRange(row, col)) return classes;
    return {
      ...classes,
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
