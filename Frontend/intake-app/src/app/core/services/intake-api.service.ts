import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ExtractionConfig,
  ExtractionConfigResponse,
  MappingResult,
  SheetPreview,
  TargetFormat,
  UploadResponse,
} from '../models/intake.models';

/**
 * Kapselt alle HTTP-Aufrufe an das .NET-Backend.
 */
@Injectable({ providedIn: 'root' })
export class IntakeApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  upload(file: File): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<UploadResponse>(`${this.baseUrl}/intake/upload`, formData);
  }

  getSheetPreview(sessionId: string, sheetName: string, range?: string): Observable<SheetPreview> {
    let params = new HttpParams();
    if (range) params = params.set('range', range);
    return this.http.get<SheetPreview>(
      `${this.baseUrl}/intake/${sessionId}/sheets/${encodeURIComponent(sheetName)}`,
      { params },
    );
  }

  getTargetFormats(): Observable<TargetFormat[]> {
    return this.http.get<TargetFormat[]>(`${this.baseUrl}/target-formats`);
  }

  saveExtractionConfig(sessionId: string, config: ExtractionConfig): Observable<ExtractionConfigResponse> {
    return this.http.put<ExtractionConfigResponse>(`${this.baseUrl}/intake/${sessionId}/extraction`, config);
  }

  executeMapping(sessionId: string): Observable<MappingResult> {
    return this.http.post<MappingResult>(`${this.baseUrl}/intake/${sessionId}/mapping`, {});
  }

  getResult(sessionId: string): Observable<MappingResult> {
    return this.http.get<MappingResult>(`${this.baseUrl}/intake/${sessionId}/result`);
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
