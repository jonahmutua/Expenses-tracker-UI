import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class HttpErrorService {
  private snackbar = inject(MatSnackBar);

  formatError(err: HttpErrorResponse) {
    return this.errorFormatter(err);
  }

  private errorFormatter(error: HttpErrorResponse) {

    if (error.status === 0) {
      return 'Network error: Please check your connection.';
    }

    switch (error.status) {
      case 400:
        return 'Bad request. Please verify your input.';
      case 401:
        return 'Unauthorized access. Please log in again.';
      case 403:
        return 'Forbidden. You do not have permission.';
      case 404:
        return 'Requested resource not found.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return `Unexpected error: ${error.message}`;
    }
   
  }

}
