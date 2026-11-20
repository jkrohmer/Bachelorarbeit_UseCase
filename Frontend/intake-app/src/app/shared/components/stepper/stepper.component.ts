import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';

export interface Step {
  path: string;
  label: string;
}

/**
 * Zeigt die vier Schritte des Intake-Prozesses an und markiert den aktuellen Schritt.
 */
@Component({
  selector: 'app-stepper',
  templateUrl: './stepper.component.html',
  styleUrl: './stepper.component.scss',
})
export class StepperComponent {
  private readonly router = inject(Router);

  readonly steps: Step[] = [
    { path: '/upload', label: 'Upload' },
    { path: '/extraction', label: 'Extraction Range' },
    { path: '/mapping', label: 'Mapping' },
    { path: '/preview', label: 'Preview' },
  ];

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly activeIndex = computed(() => {
    const index = this.steps.findIndex((s) => this.url().startsWith(s.path));
    return index < 0 ? 0 : index;
  });
}
