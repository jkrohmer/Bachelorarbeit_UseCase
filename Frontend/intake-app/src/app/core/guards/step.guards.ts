import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { IntakeStateService } from '../services/intake-state.service';

/** Schritt 2+ nur erreichbar, wenn eine Datei hochgeladen wurde. */
export const uploadRequiredGuard: CanActivateFn = () => {
  const state = inject(IntakeStateService);
  return state.hasUpload() || inject(Router).createUrlTree(['/upload']);
};

/** Schritt 3+ nur erreichbar, wenn Extraction Range und Target Format gesetzt sind. */
export const configRequiredGuard: CanActivateFn = () => {
  const state = inject(IntakeStateService);
  const router = inject(Router);
  if (!state.hasUpload()) return router.createUrlTree(['/upload']);
  return state.isConfigured() || router.createUrlTree(['/extraction']);
};
