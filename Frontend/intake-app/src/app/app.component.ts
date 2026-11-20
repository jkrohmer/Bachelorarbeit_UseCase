import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { StepperComponent } from './shared/components/stepper/stepper.component';

/**
 * Grundlayout: Kopfzeile mit Titel und Stepper, darunter die jeweilige Seite.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, StepperComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {}
