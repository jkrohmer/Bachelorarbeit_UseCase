import { Injectable, computed, signal } from '@angular/core';
import { MappingResult, SheetInfo, UploadResponse } from '../models/intake.models';

interface PersistedState {
  sessionId: string | null;
  fileName: string | null;
  sheets: SheetInfo[];
  selectedSheet: string | null;
  range: string;
  targetFormatId: string | null;
}

const STORAGE_KEY = 'intake-state';
const FALLBACK_RANGE = 'A1:P30';

/**
 * Hält den Zustand über alle Schritte hinweg (Signals).
 * Wird zusätzlich im sessionStorage abgelegt, damit ein Reload nicht alles verliert.
 */
@Injectable({ providedIn: 'root' })
export class IntakeStateService {
  readonly sessionId = signal<string | null>(null);
  readonly fileName = signal<string | null>(null);
  readonly sheets = signal<SheetInfo[]>([]);
  readonly selectedSheet = signal<string | null>(null);
  readonly range = signal<string>(FALLBACK_RANGE);
  readonly targetFormatId = signal<string | null>(null);
  readonly mappingResult = signal<MappingResult | null>(null);

  readonly hasUpload = computed(() => this.sessionId() !== null);
  readonly isConfigured = computed(() => this.hasUpload() && !!this.selectedSheet() && !!this.targetFormatId());
  readonly hasMapping = computed(() => this.mappingResult() !== null);

  constructor() {
    this.restore();
  }

  setUpload(response: UploadResponse): void {
    this.sessionId.set(response.sessionId);
    this.fileName.set(response.fileName);
    this.sheets.set(response.sheets);
    this.selectedSheet.set(response.sheets[0]?.name ?? null);
    this.range.set(response.defaultRange || FALLBACK_RANGE);
    this.targetFormatId.set(null);
    this.mappingResult.set(null);
    this.persist();
  }

  selectSheet(name: string): void {
    this.selectedSheet.set(name);
    this.persist();
  }

  setConfig(range: string, targetFormatId: string): void {
    this.range.set(range);
    this.targetFormatId.set(targetFormatId);
    this.mappingResult.set(null);
    this.persist();
  }

  setMappingResult(result: MappingResult): void {
    this.mappingResult.set(result);
  }

  reset(): void {
    this.sessionId.set(null);
    this.fileName.set(null);
    this.sheets.set([]);
    this.selectedSheet.set(null);
    this.range.set(FALLBACK_RANGE);
    this.targetFormatId.set(null);
    this.mappingResult.set(null);
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignorieren */ }
  }

  private persist(): void {
    const state: PersistedState = {
      sessionId: this.sessionId(),
      fileName: this.fileName(),
      sheets: this.sheets(),
      selectedSheet: this.selectedSheet(),
      range: this.range(),
      targetFormatId: this.targetFormatId(),
    };
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignorieren */ }
  }

  private restore(): void {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const state = JSON.parse(raw) as PersistedState;
      this.sessionId.set(state.sessionId);
      this.fileName.set(state.fileName);
      this.sheets.set(state.sheets ?? []);
      this.selectedSheet.set(state.selectedSheet);
      this.range.set(state.range || FALLBACK_RANGE);
      this.targetFormatId.set(state.targetFormatId);
    } catch { /* ignorieren */ }
  }
}
