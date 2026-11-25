import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IntakeApiService } from '../../core/services/intake-api.service';
import { IntakeStateService } from '../../core/services/intake-state.service';
import { SheetPreviewComponent } from '../../shared/components/sheet-preview/sheet-preview.component';

/**
 * Schritt 1: Excel-Datei hochladen und Sheets in der Vorschau ansehen.
 * Die Auswahl des Sheets wird sofort im Backend gespeichert.
 */
@Component({
  selector: 'app-upload-page',
  imports: [FormsModule, SheetPreviewComponent],
  templateUrl: './upload-page.component.html',
  styleUrl: './upload-page.component.scss',
})
export class UploadPageComponent {
  private readonly router = inject(Router);
  readonly state = inject(IntakeStateService);

  readonly uploading = signal(false);
  readonly dragOver = signal(false);
  readonly uploadError = signal<string | null>(null);

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
    this.state.update({ sheetName });
  }

  removeFile(): void {
    this.state.reset();
    this.uploadError.set(null);
  }

  start(): void {
    this.router.navigate(['/extraction']);
  }

  private upload(file: File): void {
    if (!/\.(xlsx|xlsm)$/i.test(file.name)) {
      this.uploadError.set('Bitte eine Excel-Datei (.xlsx oder .xlsm) auswählen.');
      return;
    }

    this.uploadError.set(null);
    this.uploading.set(true);

    this.state.upload(file).subscribe({
      next: () => this.uploading.set(false),
      error: (err) => {
        this.uploading.set(false);
        this.uploadError.set(IntakeApiService.errorMessage(err));
      },
    });
  }
}
