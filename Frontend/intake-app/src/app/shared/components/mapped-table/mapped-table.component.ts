import { Component, computed, input, output, signal } from '@angular/core';
import { CellUpdate, MappedColumn, MappingResult } from '../../../core/models/intake.models';
import { AutoFocusDirective } from '../../directives/auto-focus.directive';

/**
 * Tabelle für das Mapping-Ergebnis.
 * showSource = true  -> unter jeder Zielspalte wird angezeigt, aus welcher Source-Spalte sie stammt (Schritt 3)
 * showSource = false -> reine Ergebnis-Vorschau wie in der späteren Excel-Datei (Schritt 4)
 * editable   = true  -> Werte lassen sich per Doppelklick bearbeiten. Die Änderung wird als Änderung
 *                       der Ursprungszelle im Sheet gemeldet (cellEdit), z. B. Zielspalte "Name", Zeile 3 -> "B5".
 */
@Component({
  selector: 'app-mapped-table',
  imports: [AutoFocusDirective],
  templateUrl: './mapped-table.component.html',
  styleUrl: './mapped-table.component.scss',
})
export class MappedTableComponent {
  readonly result = input.required<MappingResult>();
  readonly showSource = input<boolean>(true);
  readonly showRowNumbers = input<boolean>(true);
  readonly editable = input<boolean>(false);

  readonly cellEdit = output<CellUpdate>();

  /** Zeilenindizes 0..rowCount-1 für die Schleife im Template. */
  readonly rowIndices = computed(() => Array.from({ length: this.result().rowCount }, (_, i) => i));

  /** Pro Zielspalte die Menge der geänderten Zeilen (für schnellen Zugriff im Template). */
  private readonly editedRows = computed(
    () => new Map(this.result().columns.map((c) => [c.targetColumn, new Set(c.editedRows)])),
  );

  /** Zelle, die gerade bearbeitet wird. */
  readonly editing = signal<{ row: number; column: string } | null>(null);

  isEdited(col: MappedColumn, row: number): boolean {
    return this.editedRows().get(col.targetColumn)?.has(row) ?? false;
  }

  /** Nur Zielspalten mit Source-Spalte haben eine Ursprungszelle und sind daher bearbeitbar. */
  canEdit(col: MappedColumn): boolean {
    return this.editable() && col.source !== null;
  }

  /** Adresse der Ursprungszelle im Sheet, z. B. "B5". */
  sourceAddress(col: MappedColumn, row: number): string | null {
    return col.source ? `${col.source.columnLetter}${this.result().sourceRowNumbers[row]}` : null;
  }

  isEditing(col: MappedColumn, row: number): boolean {
    const e = this.editing();
    return !!e && e.row === row && e.column === col.targetColumn;
  }

  startEdit(col: MappedColumn, row: number): void {
    if (this.canEdit(col)) this.editing.set({ row, column: col.targetColumn });
  }

  commitEdit(col: MappedColumn, row: number, value: string): void {
    if (!this.isEditing(col, row)) return; // z. B. blur nach Enter
    this.editing.set(null);

    const address = this.sourceAddress(col, row);
    if (address && value !== col.values[row]) {
      this.cellEdit.emit({ address, value });
    }
  }

  cancelEdit(): void {
    this.editing.set(null);
  }
}
