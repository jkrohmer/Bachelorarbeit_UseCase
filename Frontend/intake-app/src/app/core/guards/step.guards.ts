import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { IntakeStep } from '../models/intake.models';
import { IntakeStateService } from '../services/intake-state.service';

/**
 * Lässt nur die Seite zu, die zum aktuellen Schritt im Backend passt.
 * Der Schritt einer Route steht in route.data.step.
 *
 *  - Keine Session vorhanden      -> nur /upload erlaubt
 *  - Session vorhanden (ggf. nach Reload aus dem Backend geladen)
 *                                 -> Umleitung auf die Seite von currentStep
 */
export const stepGuard: CanActivateFn = (route) => {
  const state = inject(IntakeStateService);
  const router = inject(Router);
  const requestedStep = route.data['step'] as IntakeStep;

  return state.ensureLoaded().pipe(
    map((loaded) => {
      if (!loaded) return requestedStep === 'upload' || router.createUrlTree(['/upload']);

      const currentStep = state.currentStep();
      return requestedStep === currentStep || router.createUrlTree(['/', currentStep]);
    }),
  );
};
