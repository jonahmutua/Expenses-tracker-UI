import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { catchError, Observable, throwError } from "rxjs";
import { HttpErrorService } from "../utils/http-errorservice";
import { inject, Injectable } from "@angular/core";
import { SnackbarService } from "../utils/snackbar.service";

@Injectable(
    {
        providedIn: 'root'
    }
)
export class HttpErrorInterceptor implements HttpInterceptor {

    errorService = inject( HttpErrorService );

    snackbarService = inject(SnackbarService);

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        
        return next.handle( req ).pipe(
            catchError( (error: HttpErrorResponse ) => {
                const errMsg = this.errorService.formatError( error );
                // Display error notification 
                this.snackbarService.showError( errMsg, 10000 );
                return throwError( () => new Error( errMsg ));  /* Propagate error downstream */
            })
        );
    }
    
}