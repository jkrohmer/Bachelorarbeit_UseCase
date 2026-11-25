import { Component, OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CellUpdate, TargetFormat } from '../../core/models/intake.models';
import { IntakeApiService } from '../../core/services/intake-api.service';
import { IntakeStateService } from '../../core/services/intake-state.service';
import { formatRange, parseCell, parseRange } from '../../core/utils/cell-range';
import { SheetPreviewComponent } from '../../shared/components/sheet-preview/sheet-preview.component';

const DEFAULT_RANGE = 'A1:P30';

/**
 * Schritt 2: Extraction Range und Target Format festlegen.
 * Jede Änderung (Sheet, Range, Zielsystem, Zellwert) wird sofort im Backend gespeichert;
 * Vorschau und Mapping kommen jeweils aus der Antwort des Backends.
 */
@Component({
  selector: 'app-extraction-page',
  imports: [FormsModule, SheetPreviewComponent],
  templateUrl: './extraction-page.component.html',
  styleUrl: './extraction-page.component.scss',
})
export class ExtractionPageComponent implements OnInit {
  private readonly api = inject(IntakeApiService);
  readonly state = inject(IntakeStateService);

  readonly targetFormats = signal<TargetFormat[]>([]);
  readonly formatsError = signal<string | null>(null);

  // Eingabefelder der Range (werden erst beim Verlassen des Felds bzw. mit Enter gespeichert)
  readonly startCell = signal('A1');
  readonly endCell = signal('P30');

  readonly startValid = computed(() => parseCell(this.startCell()) !== null);
  readonly endValid = computed(() => parseCell(this.endCell()) !== null);

  /** Aktuell eingegebene Range (oder null, wenn ungültig). */
  readonly range = computed(() => parseRange(`${this.startCell()}:${this.endCell()}`));
  readonly rangeText = computed(() => {
    const r = this.range();
    return r ? formatRange(r) : '–';
  });

  readonly selectedFormat = computed(() =>
    this.targetFormats().find((f) => f.id === this.state.targetFormatId()) ?? null,
  );

  readonly canContinue = computed(() => this.state.canGoNext() && !this.state.saving());

  /** Zuletzt an das Backend geschickte Range – verhindert doppelte Anfragen (Enter + blur). */
  private lastSubmittedRange: string | null = null;

  constructor() {
    // Eingabefelder immer mit der im Backend gespeicherten Range abgleichen
    effect(() => {
      const range = this.state.range();
      untracked(() => this.applyRange(range));
    });
  }

  ngOnInit(): void {
    this.api.getTargetFormats().subscribe({
      next: (formats) => this.targetFormats.set(formats),
      error: (err) => this.formatsError.set(IntakeApiService.errorMessage(err)),
    });
  }

  onSheetChange(sheetName: string): void {
    this.state.update({ sheetName });
  }

  onFormatChange(targetFormatId: string): void {
    this.state.update({ targetFormatId });
  }

  /** Range speichern, sobald sie gültig ist und sich geändert hat. */
  submitRange(): void {
    const r = this.range();
    if (!r) return;

    const range = formatRange(r);
    if (range === this.lastSubmittedRange) return;

    this.lastSubmittedRange = range;
    this.state.update({ range }).subscribe({
      // Backend hat die Range abgelehnt -> Eingabe auf den gespeicherten Stand zurücksetzen
      error: () => this.applyRange(this.state.range()),
    });
  }

  onCellEdit(cell: CellUpdate): void {
    this.state.updateCells([cell]);
  }

  resetRange(): void {
    this.applyRange(DEFAULT_RANGE);
    this.submitRange();
  }

  back(): void {
    this.state.back();
  }

  next(): void {
    this.state.next();
  }

  private applyRange(value: string | null): void {
    const [start, end] = (value || DEFAULT_RANGE).split(':');
    this.startCell.set((start ?? 'A1').toUpperCase());
    this.endCell.set((end ?? 'P30').toUpperCase());
    this.lastSubmittedRange = value;
  }
}
