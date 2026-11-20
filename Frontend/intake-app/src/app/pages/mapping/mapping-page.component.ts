import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MappingResult } from '../../core/models/intake.models';
import { IntakeApiService } from '../../core/services/intake-api.service';
import { MappingResultLoader } from '../../core/services/mapping-result.loader';
import { MappedTableComponent } from '../../shared/components/mapped-table/mapped-table.component';

/**
 * Schritt 3: Zeigt das Ergebnis des Mappings.
 * Pro Zielspalte ist sichtbar, aus welcher Source-Spalte die Daten stammen.
 */
@Component({
  selector: 'app-mapping-page',
  imports: [MappedTableComponent],
  templateUrl: './mapping-page.component.html',
  styleUrl: './mapping-page.component.scss',
})
export class MappingPageComponent implements OnInit {
  private readonly loader = inject(MappingResultLoader);
  private readonly router = inject(Router);

  readonly result = signal<MappingResult | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly mappedCount = computed(() => this.result()?.columns.filter((c) => c.source).length ?? 0);
  readonly emptyTargets = computed(() => this.result()?.columns.filter((c) => !c.source) ?? []);

  ngOnInit(): void {
    this.loader.load().subscribe({
      next: (result) => {
        this.result.set(result);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(IntakeApiService.errorMessage(err));
      },
    });
  }

  back(): void {
    this.router.navigate(['/extraction']);
  }

  next(): void {
    this.router.navigate(['/preview']);
  }
}
