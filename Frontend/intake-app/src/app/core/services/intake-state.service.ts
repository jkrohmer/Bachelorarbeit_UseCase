import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  EMPTY,
  Observable,
  ReplaySubject,
  Subject,
  catchError,
  concatMap,
  finalize,
  map,
  of,
  shareReplay,
  tap,
  throwError,
} from 'rxjs';
import { CellUpdate, IntakeState, IntakeUpdate } from '../models/intake.models';
import { IntakeApiService } from './intake-api.service';

const STORAGE_KEY = 'intake-session-id';

interface QueuedRequest {
  send: () => Observable<IntakeState>;
  result: ReplaySubject<IntakeState>;
}

/**
 * Zentraler Zustand der Anwendung.
 *
 * Das Backend ist die einzige Quelle der Wahrheit: Jede Änderung wird sofort als Delta
 * an das Backend geschickt, und der Zustand wird ausschließlich aus dessen Antwort übernommen.
 * Im Browser wird nur die Session-ID gespeichert, damit ein Reload die Session wiederfindet.
 *
 * Auch die Navigation bestimmt das Backend: Schrittwechsel laufen über next()/back(), und das
 * Frontend wechselt automatisch auf die Seite des Schritts, den das Backend zurückmeldet.
 *
 * Änderungen werden in einer Warteschlange nacheinander gesendet (concatMap). So kommen sie
 * in der richtigen Reihenfolge an und eine ältere Antwort überschreibt nie eine neuere.
 */
@Injectable({ providedIn: 'root' })
export class IntakeStateService {
  private readonly api = inject(IntakeApiService);
  private readonly router = inject(Router);

  /** Letzter vom Backend bestätigter Zustand. */
  readonly snapshot = signal<IntakeState | null>(null);
  /** Anzahl noch laufender Änderungen. */
  private readonly pendingCount = signal(0);
  /** Fehler der letzten fehlgeschlagenen Änderung. */
  readonly error = signal<string | null>(null);

  readonly saving = computed(() => this.pendingCount() > 0);
  readonly hasUpload = computed(() => this.snapshot() !== null);
  readonly hasMapping = computed(() => this.snapshot()?.mapping != null);

  readonly currentStep = computed(() => this.snapshot()?.currentStep ?? null);
  readonly canGoNext = computed(() => this.snapshot()?.availableActions.includes('next') ?? false);
  readonly canGoBack = computed(() => this.snapshot()?.availableActions.includes('back') ?? false);

  readonly sessionId = computed(() => this.snapshot()?.sessionId ?? null);
  readonly fileName = computed(() => this.snapshot()?.fileName ?? null);
  readonly sheets = computed(() => this.snapshot()?.sheets ?? []);
  readonly selectedSheet = computed(() => this.snapshot()?.selectedSheet ?? null);
  readonly range = computed(() => this.snapshot()?.range ?? null);
  readonly targetFormatId = computed(() => this.snapshot()?.targetFormatId ?? null);
  readonly preview = computed(() => this.snapshot()?.preview ?? null);
  readonly mapping = computed(() => this.snapshot()?.mapping ?? null);

  private readonly queue = new Subject<QueuedRequest>();
  private restoring$: Observable<boolean> | null = null;

  constructor() {
    this.queue
      .pipe(
        concatMap(({ send, result }) =>
          send().pipe(
            tap((state) => {
              this.apply(state);
              this.error.set(null);
              result.next(state);
              result.complete();
            }),
            catchError((err) => {
              this.error.set(IntakeApiService.errorMessage(err));
              result.error(err);
              return EMPTY;
            }),
            finalize(() => this.pendingCount.update((n) => n - 1)),
          ),
        ),
      )
      .subscribe();
  }

  // ---------- Session anlegen / laden ----------

  upload(file: File): Observable<IntakeState> {
    return this.api.upload(file).pipe(tap((state) => this.apply(state)));
  }

  /**
   * Stellt nach einem Reload die Session aus dem Backend wieder her.
   * Liefert true, wenn eine Session geladen ist.
   */
  ensureLoaded(): Observable<boolean> {
    if (this.snapshot()) return of(true);

    const sessionId = this.readStoredSessionId();
    if (!sessionId) return of(false);

    this.restoring$ ??= this.api.getState(sessionId).pipe(
      tap((state) => this.apply(state)),
      map(() => true),
      catchError(() => {
        this.reset(); // Session existiert im Backend nicht mehr
        return of(false);
      }),
      finalize(() => (this.restoring$ = null)),
      shareReplay(1),
    );
    return this.restoring$;
  }

  // ---------- Änderungen (werden sofort im Backend gespeichert) ----------

  /** Konfiguration ändern (Sheet, Range, Target Format) – nur das Delta wird geschickt. */
  update(update: IntakeUpdate): Observable<IntakeState> {
    return this.enqueue((sessionId) => this.api.update(sessionId, update));
  }

  /** Zellen des aktuell ausgewählten Sheets ändern – nur die geänderten Zellen werden geschickt. */
  updateCells(cells: CellUpdate[]): Observable<IntakeState> {
    const sheetName = this.selectedSheet();
    if (!sheetName || cells.length === 0) return EMPTY;
    return this.enqueue((sessionId) => this.api.updateCells(sessionId, { sheetName, cells }));
  }

  // ---------- Schrittwechsel (das Backend entscheidet, ob er erlaubt ist) ----------

  next(): Observable<IntakeState> {
    return this.enqueue((sessionId) => this.api.next(sessionId));
  }

  back(): Observable<IntakeState> {
    return this.enqueue((sessionId) => this.api.back(sessionId));
  }

  reset(): void {
    this.snapshot.set(null);
    this.error.set(null);
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignorieren */ }
  }

  // ---------- intern ----------

  private enqueue(send: (sessionId: string) => Observable<IntakeState>): Observable<IntakeState> {
    const sessionId = this.sessionId();
    if (!sessionId) return throwError(() => new Error('Keine Session vorhanden.'));

    const result = new ReplaySubject<IntakeState>(1);
    this.pendingCount.update((n) => n + 1);
    this.queue.next({ send: () => send(sessionId), result });
    return result.asObservable();
  }

  private apply(state: IntakeState): void {
    const previousStep = this.snapshot()?.currentStep;
    this.snapshot.set(state);
    try { sessionStorage.setItem(STORAGE_KEY, state.sessionId); } catch { /* ignorieren */ }

    // Hat das Backend den Schritt gewechselt, zur passenden Seite navigieren.
    // (Beim ersten Laden kümmert sich der stepGuard um die richtige Seite.)
    if (previousStep && previousStep !== state.currentStep) {
      this.router.navigate(['/', state.currentStep]);
    }
  }

  private readStoredSessionId(): string | null {
    try { return sessionStorage.getItem(STORAGE_KEY); } catch { return null; }
  }
}
