import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { AuthTokenInterceptor } from './core/interceptors/auth-token.interceptor';
import { routes } from './app.routes';
import {  provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpErrorInterceptor } from './core/interceptors/error.interceptor';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatNativeDateModule } from '@angular/material/core';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';



export const appConfig: ApplicationConfig = {
  providers: [
  
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    provideMomentDateAdapter(),
    MatNativeDateModule,  
    importProvidersFrom(MatSnackBarModule),
     /** register interceptors with app */
    { provide: HTTP_INTERCEPTORS, useClass: AuthTokenInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: HttpErrorInterceptor, multi: true }, //HttpErrorInterceptor,/* ...after auth token interceptor*/

  ]
};
