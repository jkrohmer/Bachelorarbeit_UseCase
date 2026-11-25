import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CellsUpdate, IntakeState, IntakeUpdate, TargetFormat } from '../models/intake.models';

/**
 * Kapselt alle HTTP-Aufrufe an das .NET-Backend.
 * Alle Intake-Endpunkte antworten mit dem vollständigen Session-Zustand (IntakeState).
 */
@Injectable({ providedIn: 'root' })
export class IntakeApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  upload(file: File): Observable<IntakeState> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<IntakeState>(`${this.baseUrl}/intake/upload`, formData);
  }

  getState(sessionId: string): Observable<IntakeState> {
    return this.http.get<IntakeState>(`${this.baseUrl}/intake/${sessionId}`);
  }

  /** Konfiguration ändern – es wird nur das Delta geschickt. */
  update(sessionId: string, update: IntakeUpdate): Observable<IntakeState> {
    return this.http.patch<IntakeState>(`${this.baseUrl}/intake/${sessionId}`, update);
  }

  /** Einzelne Zellen ändern – es werden nur die geänderten Zellen geschickt. */
  updateCells(sessionId: string, update: CellsUpdate): Observable<IntakeState> {
    return this.http.patch<IntakeState>(`${this.baseUrl}/intake/${sessionId}/cells`, update);
  }

  getTargetFormats(): Observable<TargetFormat[]> {
    return this.http.get<TargetFormat[]>(`${this.baseUrl}/target-formats`);
  }

  download(sessionId: string): Observable<{ blob: Blob; fileName: string }> {
    return this.http
      .get(`${this.baseUrl}/intake/${sessionId}/download`, { responseType: 'blob', observe: 'response' })
      .pipe(
        map((response) => ({
          blob: response.body as Blob,
          fileName: this.extractFileName(response.headers.get('Content-Disposition')) ?? 'result.xlsx',
        })),
      );
  }

  /** Liest die Fehlermeldung aus einer Backend-Antwort. */
  static errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) return 'Das Backend ist nicht erreichbar. Läuft die IntakeApi?';
      if (error.error?.message) return error.error.message;
      return `Fehler ${error.status}: ${error.statusText}`;
    }
    return 'Ein unbekannter Fehler ist aufgetreten.';
  }

  private extractFileName(header: string | null): string | null {
    if (!header) return null;
    const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(header);
    if (utf8) return decodeURIComponent(utf8[1]);
    const plain = /filename="?([^";]+)"?/i.exec(header);
    return plain ? plain[1] : null;
  }
}
