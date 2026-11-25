import { Component, computed, inject } from '@angular/core';
import { CellUpdate } from '../../core/models/intake.models';
import { IntakeStateService } from '../../core/services/intake-state.service';
import { MappedTableComponent } from '../../shared/components/mapped-table/mapped-table.component';

/**
 * Schritt 3: Zeigt das Ergebnis des Mappings.
 * Pro Zielspalte ist sichtbar, aus welcher Source-Spalte die Daten stammen.
 * Werte lassen sich direkt korrigieren – die Änderung wird sofort im Backend gespeichert
 * und das Mapping neu berechnet zurückgeliefert.
 */
@Component({
  selector: 'app-mapping-page',
  imports: [MappedTableComponent],
  templateUrl: './mapping-page.component.html',
  styleUrl: './mapping-page.component.scss',
})
export class MappingPageComponent {
  readonly state = inject(IntakeStateService);

  readonly result = this.state.mapping;

  readonly mappedCount = computed(() => this.result()?.columns.filter((c) => c.source).length ?? 0);
  readonly emptyTargets = computed(() => this.result()?.columns.filter((c) => !c.source) ?? []);
  readonly editedCount = computed(
    () => this.result()?.columns.reduce((sum, c) => sum + c.editedRows.length, 0) ?? 0,
  );

  onCellEdit(cell: CellUpdate): void {
    this.state.updateCells([cell]);
  }

  back(): void {
    this.state.back();
  }

  next(): void {
    this.state.next();
  }
}
