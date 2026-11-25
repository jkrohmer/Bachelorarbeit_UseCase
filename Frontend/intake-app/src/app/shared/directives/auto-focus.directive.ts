import { AfterViewInit, Directive, ElementRef, inject } from '@angular/core';

/**
 * Setzt den Fokus auf ein Eingabefeld, sobald es angezeigt wird, und markiert den Inhalt
 * (wird für das Bearbeiten von Tabellenzellen genutzt).
 */
@Directive({ selector: 'input[appAutoFocus]' })
export class AutoFocusDirective implements AfterViewInit {
  private readonly element = inject<ElementRef<HTMLInputElement>>(ElementRef);

  ngAfterViewInit(): void {
    this.element.nativeElement.focus();
    this.element.nativeElement.select();
  }
}
