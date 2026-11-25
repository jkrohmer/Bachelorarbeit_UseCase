import { Routes } from '@angular/router';
import { mappingRequiredGuard, restoreSessionGuard, uploadRequiredGuard } from './core/guards/step.guards';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'upload' },
  {
    path: 'upload',
    title: 'Upload · Intake',
    canActivate: [restoreSessionGuard],
    loadComponent: () => import('./pages/upload/upload-page.component').then((m) => m.UploadPageComponent),
  },
  {
    path: 'extraction',
    title: 'Extraction Range · Intake',
    canActivate: [uploadRequiredGuard],
    loadComponent: () =>
      import('./pages/extraction/extraction-page.component').then((m) => m.ExtractionPageComponent),
  },
  {
    path: 'mapping',
    title: 'Mapping · Intake',
    canActivate: [mappingRequiredGuard],
    loadComponent: () => import('./pages/mapping/mapping-page.component').then((m) => m.MappingPageComponent),
  },
  {
    path: 'preview',
    title: 'Preview · Intake',
    canActivate: [mappingRequiredGuard],
    loadComponent: () =>
      import('./pages/result-preview/result-preview-page.component').then((m) => m.ResultPreviewPageComponent),
  },
  { path: '**', redirectTo: 'upload' },
];
