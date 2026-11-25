import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IntakeApiService } from '../../core/services/intake-api.service';
import { IntakeStateService } from '../../core/services/intake-state.service';
import { MappedTableComponent } from '../../shared/components/mapped-table/mapped-table.component';

/**
 * Schritt 4: Vorschau des Endergebnisses und Download als Excel-Datei.
 * Der Download wird vom Backend aus dem aktuell gespeicherten Zustand erzeugt.
 */
@Component({
  selector: 'app-result-preview-page',
  imports: [MappedTableComponent],
  templateUrl: './result-preview-page.component.html',
  styleUrl: './result-preview-page.component.scss',
})
export class ResultPreviewPageComponent {
  private readonly api = inject(IntakeApiService);
  private readonly router = inject(Router);
  readonly state = inject(IntakeStateService);

  readonly result = this.state.mapping;
  readonly downloading = signal(false);
  readonly error = signal<string | null>(null);

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
