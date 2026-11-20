import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs';
import { SheetPreview, TargetFormat } from '../../core/models/intake.models';
import { IntakeApiService } from '../../core/services/intake-api.service';
import { IntakeStateService } from '../../core/services/intake-state.service';
import { formatRange, parseCell, parseRange } from '../../core/utils/cell-range';
import { SheetPreviewComponent } from '../../shared/components/sheet-preview/sheet-preview.component';

const DEFAULT_RANGE = 'A1:P30';

/**
 * Schritt 2: Extraction Range und Target Format festlegen.
 * Die Range wird in der Vorschau als Rahmen angezeigt.
 */
@Component({
  selector: 'app-extraction-page',
  imports: [FormsModule, SheetPreviewComponent],
  templateUrl: './extraction-page.component.html',
  styleUrl: './extraction-page.component.scss',
})
export class ExtractionPageComponent implements OnInit {
  private readonly api = inject(IntakeApiService);
  private readonly router = inject(Router);
  readonly state = inject(IntakeStateService);

  readonly preview = signal<SheetPreview | null>(null);
  readonly targetFormats = signal<TargetFormat[]>([]);
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  // Formularwerte
  readonly startCell = signal('A1');
  readonly endCell = signal('P30');
  readonly selectedFormatId = signal<string | null>(null);

  readonly startValid = computed(() => parseCell(this.startCell()) !== null);
  readonly endValid = computed(() => parseCell(this.endCell()) !== null);

  /** Aktuell eingestellte Range (oder null, wenn ungültig). */
  readonly range = computed(() => parseRange(`${this.startCell()}:${this.endCell()}`));
  readonly rangeText = computed(() => {
    const r = this.range();
    return r ? formatRange(r) : '–';
  });

  readonly selectedFormat = computed(() =>
    this.targetFormats().find((f) => f.id === this.selectedFormatId()) ?? null,
  );

  readonly canContinue = computed(() => !!this.range() && !!this.selectedFormat() && !this.submitting());

  ngOnInit(): void {
    this.applyRange(this.state.range());
    this.selectedFormatId.set(this.state.targetFormatId());

    this.api.getTargetFormats().subscribe({
      next: (formats) => {
        this.targetFormats.set(formats);
        if (!this.selectedFormatId() && formats.length > 0) {
          this.selectedFormatId.set(formats[0].id);
        }
      },
      error: (err) => this.error.set(IntakeApiService.errorMessage(err)),
    });

    this.loadPreview();
  }

  onSheetChange(sheetName: string): void {
    this.state.selectSheet(sheetName);
    this.loadPreview();
  }

  /** Nach Änderung der Range: Vorschau neu laden, falls die Range über den sichtbaren Bereich hinausgeht. */
  onRangeChanged(): void {
    const r = this.range();
    const p = this.preview();
    if (r && p && (r.endRow >= p.rows.length || r.endColumn >= p.columnLetters.length)) {
      this.loadPreview();
    }
  }

  resetRange(): void {
    this.applyRange(DEFAULT_RANGE);
    this.onRangeChanged();
  }

  back(): void {
    this.router.navigate(['/upload']);
  }

  /** Konfiguration speichern, Mapping ausführen und zu Schritt 3 wechseln. */
  next(): void {
    const sessionId = this.state.sessionId();
    const sheet = this.state.selectedSheet();
    const range = this.range();
    const format = this.selectedFormat();
    if (!sessionId || !sheet || !range || !format) return;

    const rangeText = formatRange(range);
    this.submitting.set(true);
    this.error.set(null);

    this.api
      .saveExtractionConfig(sessionId, { sheetName: sheet, range: rangeText, targetFormatId: format.id })
      .pipe(switchMap(() => this.api.executeMapping(sessionId)))
      .subscribe({
        next: (result) => {
          this.state.setConfig(rangeText, format.id);
          this.state.setMappingResult(result);
          this.submitting.set(false);
          this.router.navigate(['/mapping']);
        },
        error: (err) => {
          this.submitting.set(false);
          this.error.set(IntakeApiService.errorMessage(err));
        },
      });
  }

  private applyRange(value: string): void {
    const [start, end] = (value || DEFAULT_RANGE).split(':');
    this.startCell.set((start ?? 'A1').toUpperCase());
    this.endCell.set((end ?? 'P30').toUpperCase());
  }

  private loadPreview(): void {
    const sessionId = this.state.sessionId();
    const sheet = this.state.selectedSheet();
    if (!sessionId || !sheet) return;

    const r = this.range();
    this.loading.set(this.preview() === null);
    this.api.getSheetPreview(sessionId, sheet, r ? formatRange(r) : undefined).subscribe({
      next: (preview) => {
        this.preview.set(preview);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(IntakeApiService.errorMessage(err));
      },
    });
  }
}
