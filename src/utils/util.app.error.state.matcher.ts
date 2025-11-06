/**
 * Configurable and reusable ErrorStateMatcher
 *
 * Supports both default behaviour ans integration with DelayErrorHandler
 */

import { Signal, signal } from '@angular/core';
import { AbstractControl, FormGroupDirective, NgForm } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';

export interface ErrorMatcherConfig {
  showErrorsSignal?: Signal<boolean>; // Optional signal (From DelayedErrorHandler)
  showOn?: 'touched' | 'dirty' | 'submitted'; // Controlls when to show errors
}

export class AppErrorStateMatcher implements ErrorStateMatcher {
  private showErrorsSignal?: Signal<boolean>;
  private showOn: 'touched' | 'dirty' | 'submitted';

  constructor(config?: ErrorMatcherConfig) {
    this.showOn = config?.showOn ?? 'touched';
    this.showErrorsSignal = config?.showErrorsSignal;
  }

  isErrorState(control: AbstractControl | null, form: FormGroupDirective | NgForm | null): boolean {
    if (!control) return false;

    const isSubmitted = !!(form && form.submitted);

    //  If a reactive signal (DelayedErrorHandler) is provided, defer to it
    if (this.showErrorsSignal) {
      return !!(control.invalid && this.showErrorsSignal());
    }

    //  Otherwise, fall back to configurable standard behavior
    switch (this.showOn) {
      case 'dirty':
        return !!(control.invalid && (control.dirty || isSubmitted));
      case 'submitted':
        return !!(control.invalid && isSubmitted);
      case 'touched':
      default:
        return !!(control.invalid && (control.touched || isSubmitted));
    }
  }
}
