import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import { MappingResult } from '../models/intake.models';
import { IntakeApiService } from './intake-api.service';
import { IntakeStateService } from './intake-state.service';

/**
 * Liefert das Mapping-Ergebnis: aus dem State, sonst vom Backend
 * (z. B. nach einem Browser-Reload). Existiert noch keins, wird das Mapping ausgeführt.
 */
@Injectable({ providedIn: 'root' })
export class MappingResultLoader {
  private readonly api = inject(IntakeApiService);
  private readonly state = inject(IntakeStateService);

  load(): Observable<MappingResult> {
    const cached = this.state.mappingResult();
    if (cached) return of(cached);

    const sessionId = this.state.sessionId();
    if (!sessionId) return throwError(() => new Error('Keine Session vorhanden.'));

    return this.api.getResult(sessionId).pipe(
      catchError((err) => (err?.status === 400 ? this.api.executeMapping(sessionId) : throwError(() => err))),
      tap((result) => this.state.setMappingResult(result)),
    );
  }
}
