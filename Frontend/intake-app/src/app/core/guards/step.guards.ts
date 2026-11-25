import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { IntakeStateService } from '../services/intake-state.service';

/** Stellt eine vorhandene Session aus dem Backend wieder her (z. B. nach Reload), blockiert aber nie. */
export const restoreSessionGuard: CanActivateFn = () =>
  inject(IntakeStateService).ensureLoaded().pipe(map(() => true));

/** Schritt 2+ nur erreichbar, wenn eine Datei hochgeladen wurde. */
export const uploadRequiredGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(IntakeStateService)
    .ensureLoaded()
    .pipe(map((loaded) => loaded || router.createUrlTree(['/upload'])));
};

/** Schritt 3+ nur erreichbar, wenn aus Extraction Range und Target Format ein Mapping entsteht. */
export const mappingRequiredGuard: CanActivateFn = () => {
  const state = inject(IntakeStateService);
  const router = inject(Router);
  return state.ensureLoaded().pipe(
    map((loaded) => {
      if (!loaded) return router.createUrlTree(['/upload']);
      return state.hasMapping() || router.createUrlTree(['/extraction']);
    }),
  );
};
