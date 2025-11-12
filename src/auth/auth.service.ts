import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  inject,
  Injectable,
  signal,
  effect,
  computed,
} from '@angular/core';
import { LoginRequest, LoginResponse } from './login/login.model';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  of,
  Subject,
  switchMap,
  Observable,
  tap,
  finalize,
} from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorService } from '../utils/http-errorservice';
import { environment } from '../environments/environment';
import { Token } from '@angular/compiler';

@Injectable({ providedIn: 'root' })
export class AuthService {

  // === BASE URL ===
  private baseUrl = `${environment.apiBaseUrl}`;

  private http = inject(HttpClient);

  private errorService = inject(HttpErrorService);

  // === SIGNALS ===
  auth_token_sig = signal<string | null>(null);

  loginResponse = signal<LoginResponse>({ token: null, message: null, error: false });

  isLoading = signal(false);

  // === COMPUTED AUTH STATE ===
  isAuthenticatedSignal = computed(() => !!this.loginResponse().token);

  // === SUBJECT-BASED LOGIN PIPELINE ===
  private loginRequest$ = new Subject<LoginRequest>();

  loginSignal = toSignal(
    this.loginRequest$.pipe(
      debounceTime(200), /* filter out double clicks */
      switchMap((req) => this._login(req))
    ),
    { initialValue: { token: null, message: null, error: false } }
  );

  

  constructor() {
    // Restore stored token at app start
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      this.loginResponse.set({ token: storedToken, message: null, error: false });
    }

    // Reactively watch for login results from loginSignal
    effect(() => {
      const res = this.loginSignal();
      if (!res?.token && !res?.error) return;
      this.updateLoginResponse(res);
      this.isLoading.set(false);
    });

    // Keep auth_token_sig and localStorage in sync
    effect(() => {
      const token = this.loginResponse().token;
      this.setToken(token);
    });
  }

  // ===========================================================
  //  HYBRID LOGIN METHOD (Observable + Signal Sync)
  // ===========================================================
  login(req: LoginRequest): Observable<LoginResponse> {
    this.isLoading.set(true);
    return this._login(req).pipe(
      tap((res: LoginResponse) => {
        this.updateLoginResponse(res);
        if (res.token) this.setToken(res.token);
      }),
      catchError((err: HttpErrorResponse) => {
        const errMsg = this.errorService.formatError(err);
        const res: LoginResponse = { token: null, message: errMsg, error: true };
        this.updateLoginResponse(res);
        return of(res);
      }),
      finalize(() => this.isLoading.set(false))
    );
  }

  /** Reactive login using subject (optional, called from components if you prefer signal mode) */
  triggerLogin(req: LoginRequest): void {
    this.isLoading.set(true);
    this.loginRequest$.next(req);
  }

  logout(): void {
    this.setToken(null);
    this.loginResponse.set({ token: null, message: null, error: false });
    this.isLoading.set(false);
  }

  private _login(loginRequest: LoginRequest): Observable<LoginResponse> {
    const url = `${this.baseUrl}${environment.endpoints.login}`;
    return this.http.post<LoginResponse>(url, loginRequest).pipe(
      catchError((err: HttpErrorResponse) => {
        const errMsg = this.errorService.formatError(err);
        return of({ token: null, message: errMsg, error: true });
      })
    );
  }

  private updateLoginResponse(res: LoginResponse): void {
    this.loginResponse.set({
      token: res.token,
      message: res.message,
      error: res.error ?? false,
    });
  }

  private setToken(token: string | null): void {
    if (token) {
      localStorage.setItem('auth_token', token);
      this.auth_token_sig.set(token);
    } else {
      localStorage.removeItem('auth_token');
      this.auth_token_sig.set(null);
    }
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSignal();
  }
}
