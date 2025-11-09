import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { AuthTokenInterceptor } from '../interceptors/auth-token.interceptor';

import { routes } from './app.routes';
import {  provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpErrorInterceptor } from '../interceptors/error.interceptor';
import { MatSnackBarModule } from '@angular/material/snack-bar';



export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
  
    importProvidersFrom(MatSnackBarModule),
     /** register interceptors with app */
    { provide: HTTP_INTERCEPTORS, useClass: AuthTokenInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: HttpErrorInterceptor, multi: true }, //HttpErrorInterceptor,/* ...after auth token interceptor*/

  ]
};
