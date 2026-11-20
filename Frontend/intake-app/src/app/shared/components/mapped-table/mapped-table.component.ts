import { Component, computed, input } from '@angular/core';
import { MappingResult } from '../../../core/models/intake.models';

/**
 * Tabelle für das Mapping-Ergebnis.
 * showSource = true  -> unter jeder Zielspalte wird angezeigt, aus welcher Source-Spalte sie stammt (Schritt 3)
 * showSource = false -> reine Ergebnis-Vorschau wie in der späteren Excel-Datei (Schritt 4)
 */
@Component({
  selector: 'app-mapped-table',
  templateUrl: './mapped-table.component.html',
  styleUrl: './mapped-table.component.scss',
})
export class MappedTableComponent {
  readonly result = input.required<MappingResult>();
  readonly showSource = input<boolean>(true);
  readonly showRowNumbers = input<boolean>(true);

  /** Zeilenindizes 0..rowCount-1 für die Schleife im Template. */
  readonly rowIndices = computed(() => Array.from({ length: this.result().rowCount }, (_, i) => i));
}
