import { inject, Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../environments/environment';
import { AuthService } from '../auth/auth.service';
import { JwtUtilService } from '../utils/jwt-util.service';

/* classical approach */
@Injectable({
  providedIn: 'root',
})
export class AuthTokenInterceptor implements HttpInterceptor {

    private router = inject(Router);

    private authService  = inject(AuthService);

    private jwtService = inject(JwtUtilService);


  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    //const token = localStorage.getItem('auth_token');
    const token = this.authService.auth_token_sig();

    // early redirect to login ... avoid 401 error responses
    if( token && this.jwtService.isExpired(token) ){
         this.redirectToLogin();
         throwError(()=> new Error('Token Expired'));
    }

    // only add the authorization header if token is available and not expired else keep request as is.
    const authReq = (token ) ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

    return next.handle(authReq).pipe(
        catchError( (error : HttpErrorResponse) => {
        
            if( error.status === 401 ){
                this.redirectToLogin();
            }

            return throwError( () => error) ; // propagate error downnstream
        })
    );
  }

  // rediriects to login page 
  private redirectToLogin(): void {
    localStorage.removeItem("auth_token");
    const loginUrl = `${environment.endpoints.login}`;

    // redirect onl if not in login page 
    if( !this.router.url.includes(loginUrl)){
        this.router.navigate([loginUrl]);
    }
  }
}

/** FUnctional approach */
/** 
import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
export const authTokenInterceptor: HttpInterceptorFn = ( req, next) => {

    const token = localStorage.getItem("auth_token");

    // only add the authorization header if token is available 
    if( token ){
        const cloned = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });

        return next(cloned);
    }

    // if token is not provided, return request as is
    return next(req);
}
*/
