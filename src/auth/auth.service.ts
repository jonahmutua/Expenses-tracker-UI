import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal, computed, effect } from '@angular/core';
import { LoginRequest, LoginResponse } from './login/login.model';
import { catchError, of, Observable, tap, finalize, debounceTime, switchMap, Subject } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorService } from '../utils/http-errorservice';
import { environment } from '../environments/environment';
import { JwtUtilService } from '../utils/jwt-util.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = `${environment.apiBaseUrl}`;
  private http = inject(HttpClient);
  private errorService = inject(HttpErrorService);
  private jwtService = inject(JwtUtilService);

  // === SIGNALS ===
  private token = signal<string | null>(null);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  username = signal<string | null>(null);

  // === COMPUTED AUTH STATE ===
  isAuthenticated = computed(() => {
    const t = this.token();
    const stored = localStorage.getItem('auth_token');
    if(!t || !stored  ) return false; 
    return !this.jwtService.isExpired(t);
  });

  // === SUBJECT-BASED LOGIN PIPELINE ===
  private loginRequest$ = new Subject<LoginRequest>();

  loginSignal = toSignal(
    this.loginRequest$.pipe(
      debounceTime(200), // Filter out double clicks
      switchMap((req) => this._login(req))
    ),
    { initialValue: { token: null, message: null, error: false } }
  );

  constructor() {
    // Restore stored token at app start
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken && !this.jwtService.isExpired(storedToken)) {
      this.token.set(storedToken);
    } else if (storedToken) {
      // Clear expired token
      localStorage.removeItem('auth_token');
    }

    // Reactively watch for login results from loginSignal
    effect(() => {
      const res = this.loginSignal();
      if (!res?.token && !res?.error) return;
      
      if (res.token) {
        this.token.set(res.token);
        this.errorMessage.set(null);
      } else if (res.error) {
        this.errorMessage.set(res.message);
      }
      
      this.isLoading.set(false);
    });

    // Keep token and localStorage in sync
    effect(() => {
      const t = this.token();
      if (t) {
        localStorage.setItem('auth_token', t);
      } else {
        localStorage.removeItem('auth_token');
      }
      const userName = this.jwtService.getClaim( t! , 'sub');
      this.username.set(userName);
    });

    // Extract user info when token changes
    effect( () => {
      const tkn = this.token();
      if(!tkn){
        this.username.set(null);
        return;
      }
      const userName = this.jwtService.getClaim(tkn, 'sub');
      this.username.set( userName );
    });

  }

  // === PUBLIC API ===

  getToken(): string | null {
    return this.token();
  }

  /** Observable-based login */
  login(req: LoginRequest): Observable<LoginResponse> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    return this._login(req).pipe(
      tap((res: LoginResponse) => {
        if (res.token) {
          this.token.set(res.token);
        } else if (res.error) {
          this.errorMessage.set(res.message);
        }
      }),
      catchError((err: HttpErrorResponse) => {
        const errMsg = this.errorService.formatError(err);
        this.errorMessage.set(errMsg);
        return of({ token: null, message: errMsg, error: true });
      }),
      finalize(() => this.isLoading.set(false))
    );
  }

  /** Signal-based login (triggers reactive pipeline) */
  triggerLogin(req: LoginRequest): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.loginRequest$.next(req);
  }

  /** Logout and clear all auth state */
  logout(): void {
    this.token.set(null);
    this.errorMessage.set(null);
    this.isLoading.set(false);
    this.username.set(null);
  }


  // === PRIVATE METHODS ===

  private _login(loginRequest: LoginRequest): Observable<LoginResponse> {
    const url = `${this.baseUrl}${environment.endpoints.login}`;
    return this.http.post<LoginResponse>(url, loginRequest).pipe(
      catchError((err: HttpErrorResponse) => {
        const errMsg = this.errorService.formatError(err);
        return of({ token: null, message: errMsg, error: true });
      })
    );
  }
}




