import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MappingResult } from '../../core/models/intake.models';
import { IntakeApiService } from '../../core/services/intake-api.service';
import { IntakeStateService } from '../../core/services/intake-state.service';
import { MappingResultLoader } from '../../core/services/mapping-result.loader';
import { MappedTableComponent } from '../../shared/components/mapped-table/mapped-table.component';

/**
 * Schritt 4: Vorschau des Endergebnisses und Download als Excel-Datei.
 */
@Component({
  selector: 'app-result-preview-page',
  imports: [MappedTableComponent],
  templateUrl: './result-preview-page.component.html',
  styleUrl: './result-preview-page.component.scss',
})
export class ResultPreviewPageComponent implements OnInit {
  private readonly api = inject(IntakeApiService);
  private readonly loader = inject(MappingResultLoader);
  private readonly router = inject(Router);
  readonly state = inject(IntakeStateService);

  readonly result = signal<MappingResult | null>(null);
  readonly loading = signal(true);
  readonly downloading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.loader.load().subscribe({
      next: (result) => {
        this.result.set(result);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(IntakeApiService.errorMessage(err));
      },
    });
  }

  download(): void {
    const sessionId = this.state.sessionId();
    if (!sessionId) return;

    this.downloading.set(true);
    this.error.set(null);

    this.api.download(sessionId).subscribe({
      next: ({ blob, fileName }) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        this.downloading.set(false);
      },
      error: (err) => {
        this.downloading.set(false);
        this.error.set(IntakeApiService.errorMessage(err));
      },
    });
  }

  back(): void {
    this.router.navigate(['/mapping']);
  }

  startOver(): void {
    this.state.reset();
    this.router.navigate(['/upload']);
  }
}
