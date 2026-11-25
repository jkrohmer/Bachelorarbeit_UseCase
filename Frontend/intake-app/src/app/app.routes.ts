import { Routes } from '@angular/router';
import { stepGuard } from './core/guards/step.guards';

/**
 * Eine Route pro Schritt. Welche davon angezeigt werden darf, entscheidet der stepGuard
 * anhand des aktuellen Schritts im Backend (data.step muss dem IntakeStep entsprechen).
 */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'upload' },
  {
    path: 'upload',
    title: 'Upload · Intake',
    data: { step: 'upload' },
    canActivate: [stepGuard],
    loadComponent: () => import('./pages/upload/upload-page.component').then((m) => m.UploadPageComponent),
  },
  {
    path: 'extraction',
    title: 'Extraction Range · Intake',
    data: { step: 'extraction' },
    canActivate: [stepGuard],
    loadComponent: () =>
      import('./pages/extraction/extraction-page.component').then((m) => m.ExtractionPageComponent),
  },
  {
    path: 'mapping',
    title: 'Mapping · Intake',
    data: { step: 'mapping' },
    canActivate: [stepGuard],
    loadComponent: () => import('./pages/mapping/mapping-page.component').then((m) => m.MappingPageComponent),
  },
  {
    path: 'preview',
    title: 'Preview · Intake',
    data: { step: 'preview' },
    canActivate: [stepGuard],
    loadComponent: () =>
      import('./pages/result-preview/result-preview-page.component').then((m) => m.ResultPreviewPageComponent),
  },
  { path: '**', redirectTo: 'upload' },
];
