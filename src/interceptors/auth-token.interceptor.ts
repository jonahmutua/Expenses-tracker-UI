import { inject, Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../environments/environment';
import { AuthService } from '../auth/auth.service';
import { isPublicEndpoint } from '../utils/auth.util';

@Injectable({
  providedIn: 'root',
})
export class AuthTokenInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);
  private router = inject(Router);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    
    // For public endpoints we skip JWT auth checks 
    if( isPublicEndpoint(req.url) ){
      return next.handle(req);
    }

    // If we ever get here, this endpoint is not publc , We check if authentecated and act accordingly
    const token = this.authService.getToken();

    // Check if authenticated (validates token existence AND expiry)
    if (!this.authService.isAuthenticated()) {
      this.authService.logout();
      this.redirectToLogin();
      return throwError(() => new Error('Invalid or expired token'));
    }

    // At this point we are authenticated and token is not expired we Add authorization header
    const authReq = req.clone({ 
      setHeaders: { Authorization: `Bearer ${token}` } 
    });

    // IF we ever fall into 401 error let us redirect User to '/login' endpoint 
    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.authService.logout();
          this.redirectToLogin();
        }
        return throwError(() => error); // else cascade error upstream
      })
    );
  }

  private redirectToLogin(): void {
    const loginUrl = `${environment.endpoints.login}`;
    if (!this.router.url.includes(loginUrl)) {
      this.router.navigate([loginUrl]);
    }
  }
  
}