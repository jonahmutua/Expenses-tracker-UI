import { inject, Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../environments/environment';

/* classical approach */
@Injectable({
  providedIn: 'root',
})
export class AuthTokenInterceptor implements HttpInterceptor {

    private router = inject(Router);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    const token = localStorage.getItem('auth_token');

    // only add the authorization header if token is available else keep request as is.
    const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

    return next.handle(authReq).pipe(
        catchError( (error : HttpErrorResponse) => {

            if( error.status === 401){
                
                localStorage.removeItem("auth_token");
                const loginUrl = `${environment.endpoints.login}`;

                // redirect onl if not in login page 
                if( !this.router.url.includes(loginUrl)){
                    this.router.navigate([loginUrl]);
                }
            }

            return throwError( () => error) ; // propagate error downnstream
        })
    );
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
