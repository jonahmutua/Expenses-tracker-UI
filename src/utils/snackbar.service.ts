import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class SnackbarService {

  private snackbar = inject(MatSnackBar);

  showError(msg: string, duration = 4000): void {
    this.snackbar.open(msg, 'Dismiss', {
      duration,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
      panelClass: ['snackbar-error'] /*styling*/
    });
  }

  showSuccess(msg: string, duration = 4000): void {
    this.snackbar.open(msg, 'Dismiss', {
      duration,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
      panelClass: ['snackbar-success'] /*styling*/
    });
  }

  showInfo(msg: string, duration = 4000): void {
    this.snackbar.open(msg, 'Dismiss', {
      duration,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
      panelClass: ['snackbar-info'] /*styling*/
    });
  }


}
