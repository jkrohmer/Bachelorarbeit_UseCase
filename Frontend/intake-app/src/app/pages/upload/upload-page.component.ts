import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SheetPreview } from '../../core/models/intake.models';
import { IntakeApiService } from '../../core/services/intake-api.service';
import { IntakeStateService } from '../../core/services/intake-state.service';
import { SheetPreviewComponent } from '../../shared/components/sheet-preview/sheet-preview.component';

/**
 * Schritt 1: Excel-Datei hochladen und Sheets in der Vorschau ansehen.
 */
@Component({
  selector: 'app-upload-page',
  imports: [FormsModule, SheetPreviewComponent],
  templateUrl: './upload-page.component.html',
  styleUrl: './upload-page.component.scss',
})
export class UploadPageComponent implements OnInit {
  private readonly api = inject(IntakeApiService);
  private readonly router = inject(Router);
  readonly state = inject(IntakeStateService);

  readonly uploading = signal(false);
  readonly loadingPreview = signal(false);
  readonly dragOver = signal(false);
  readonly error = signal<string | null>(null);
  readonly preview = signal<SheetPreview | null>(null);

  ngOnInit(): void {
    // Zurück-Navigation: vorhandene Datei erneut anzeigen
    if (this.state.hasUpload()) {
      this.loadPreview();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.upload(file);
    input.value = ''; // gleiche Datei erneut auswählbar machen
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.upload(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(true);
  }

  onSheetChange(sheetName: string): void {
    this.state.selectSheet(sheetName);
    this.loadPreview();
  }

  removeFile(): void {
    this.state.reset();
    this.preview.set(null);
    this.error.set(null);
  }

  start(): void {
    this.router.navigate(['/extraction']);
  }

  private upload(file: File): void {
    if (!/\.(xlsx|xlsm)$/i.test(file.name)) {
      this.error.set('Bitte eine Excel-Datei (.xlsx oder .xlsm) auswählen.');
      return;
    }

    this.error.set(null);
    this.uploading.set(true);
    this.preview.set(null);

    this.api.upload(file).subscribe({
      next: (response) => {
        this.state.setUpload(response);
        this.uploading.set(false);
        this.loadPreview();
      },
      error: (err) => {
        this.uploading.set(false);
        this.error.set(IntakeApiService.errorMessage(err));
      },
    });
  }

  private loadPreview(): void {
    const sessionId = this.state.sessionId();
    const sheet = this.state.selectedSheet();
    if (!sessionId || !sheet) return;

    this.loadingPreview.set(true);
    this.api.getSheetPreview(sessionId, sheet).subscribe({
      next: (preview) => {
        this.preview.set(preview);
        this.loadingPreview.set(false);
      },
      error: (err) => {
        this.loadingPreview.set(false);
        this.error.set(IntakeApiService.errorMessage(err));
        // Session im Backend nicht mehr vorhanden -> neu starten
        if (err?.status === 404) this.state.reset();
      },
    });
  }
}
