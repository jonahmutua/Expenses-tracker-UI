import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  inject,
  Injectable,
  signal,
  effect,
  runInInjectionContext,
  Injector,
  computed,
} from '@angular/core';
import { LoginRequest, LoginResponse } from './login/login.model';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  Observable,
  of,
  switchMap,
 
} from 'rxjs';
import { HttpErrorService } from '../utils/http-errorservice';
import { toSignal } from '@angular/core/rxjs-interop';
import { environment } from '../environments/environment'; /* Ensure to import the correct environment */

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  
  // token as signal 
  auth_token_sig = signal<string | null>(null);

  //refresh_token_sig = signal<srting | null >( null); // for now is unused
  loginResponse = signal<LoginResponse>({ token: null, message: null, error: false });

  isLoading = signal<boolean>(false);

  // computed signal - automatically updates every time loginResponse changes
  isAuthenticatedSignal = computed(() => !!this.loginResponse().token);

  private http = inject(HttpClient);

  private errorService = inject(HttpErrorService);

  private injector = inject(Injector);

  private baseUrl: string = `${environment.apiBaseUrl}`;

  constructor() {
    /* on app load, retrieve stored token */
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      this.loginResponse.set({ token: storedToken, message: null, error: false });
    }

    // Ensure signal and local sorage are in sync
    effect((): void => {
      const token = this.loginResponse().token;
      this.setToken(token);
    });

  }

  //  automatically updates when triggerd
  login(loginRequest: LoginRequest): void {
    // Perform-login, never subscribe manually
    runInInjectionContext(this.injector, () => {
      // change loading signal
      this.isLoading.set(true);
      // Wrap the loginRequest in an observable for debouncing/distinctUntilChanged
      const loginRequest$ = of(loginRequest).pipe(
        // wait briefly to absorb rapid repeated clicks
        debounceTime(300),
        // ignore if same username/password are sent repeatedly
        distinctUntilChanged(
          (prev, curr) => prev.username === curr.username && prev.password === curr.password
        ),
        // switch to actual login request
        switchMap((req) => this._login(req))
      );

      const loginSignal = toSignal(loginRequest$, {
        initialValue: { token: null, message: null, error: false },
      });

      // watch for loginSignal changes and update loginResponse signal ( our main signal)
      effect(() => {
        const res = loginSignal();
        if (!res?.token && !res?.error) return; // ignore initial dummy  values
        this.updateLoginResponse( res );
      });

    });
  }

  logout(): void{
   this.setToken(null);
   this.loginResponse.set({ token: null, message: null, error: false });
  }

  private _login(loginRequest: LoginRequest): Observable<LoginResponse | null> {
    const targetUrl =   `${this.baseUrl}${environment.endpoints.login}`;
   
    return this.http.post<LoginResponse | null>(targetUrl, loginRequest).pipe(
      catchError((err) => {
        const errMsg = this.errorHandler(err);
        return of({ token: null, message: errMsg, error: true } as LoginResponse) ;
      })
    );
    
  }

  private updateLoginResponse(res: LoginResponse){
    //real backend update ocurred, update
        this.loginResponse.set({
          token: res.token,
          message: res.message,
          error: res.error ?? false,
        });
        // loading is complete
        this.isLoading.set(false);
  }
  // save token after login
  saveToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  // clear token
  clearToken(): void {
    localStorage.removeItem('auth_token');
  }

  // quick check if authenticated
  isAuthenticated(): boolean {
    return this.isAuthenticatedSignal();
  }

  private errorHandler(err: HttpErrorResponse): string {
    return this.errorService.formatError(err);
  }

  private setToken(token: string | null): void {
    // use localStorage to store the token - although unsafe, we shall change to cookies
    if (token){
      localStorage.setItem('auth_token', token);
      this.auth_token_sig.set( token);  
    } else {
      localStorage.removeItem('auth_token');
      this.auth_token_sig.set( token );
    }
    // Later: replace with cookie logic
    // document.cookie = `auth_token=${token}; path=/; Secure; SameSite=Strict`;
  }
}
