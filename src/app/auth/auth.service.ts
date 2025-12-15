import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal, computed, effect } from '@angular/core';
import { LoginRequest } from './dto/login.request';
import { catchError, of, Observable, tap, finalize, debounceTime, switchMap, Subject } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorService } from '../shared/utils/http-errorservice';
import { environment } from '../../environments/environment';
import { JwtUtilService } from '../shared/utils/jwt-util.service';
import { RegisterRequest } from './dto/register.request';
import { AuthResponse } from './dto/auth.response';

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
  private signupRequest$ = new Subject<RegisterRequest>();

  // AUTH STATES
  loginState = this.buildSignal(this.loginRequest$, (req) => this._login(req));
  signupState = this.buildSignal(this.signupRequest$, (req) => this._register(req));
 

  constructor() {

    // Restore stored token during app start
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken && !this.jwtService.isExpired(storedToken)) {
      this.token.set(storedToken);
    } else {
      localStorage.removeItem('auth_token');
    }

    // Keep token and localStorage in sync + extract username
    effect(() => {
      const t = this.token();
      if (t) {
        localStorage.setItem('auth_token', t);
        this.username.set(this.jwtService.getClaim(t, 'sub'));
      } else {
        localStorage.removeItem('auth_token');
        this.username.set(null);
      }
    });
   

    // Reactively watch for login/signup results 
    effect(() => {
      const loginRes = this.loginState();
      const signupRes = this.signupState();

      const res = loginRes.token ? loginRes: signupRes;

      if (!res?.token && !res?.error) return;
      
      if (res.token) {
        this.token.set(res.token);
        this.errorMessage.set(null);
      } else if (res.error) {
        this.errorMessage.set(res.message);
      }

    });

  }

  // === PUBLIC API ===

  getToken(): string | null {
    return this.token();
  }

  /** Signal-based login (triggers reactive pipeline) */
  triggerLogin(req: LoginRequest): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.loginRequest$.next(req);
  }

  triggerSignup(req: RegisterRequest): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.signupRequest$.next(req);
  }

  /** Logout and clear all auth state */
  logout(): void {
    this.token.set(null);
    this.errorMessage.set(null);
    this.isLoading.set(false);
    this.username.set(null);
  }


  // === PRIVATE METHODS ===
  private buildSignal<TReq, TRes>(source$: Observable<TReq>, handler: (req: TReq) => Observable<TRes> ) {
    return toSignal(
      source$.pipe(
        debounceTime(200), // Filter out double clicks
        switchMap((req) => 
         handler(req).pipe(
          catchError((err: HttpErrorResponse) => of(this.handleError(err))),
          finalize( ()=> this.isLoading.set(false) )
          )
        )
      ),
      { initialValue: { token: null, message: null, error: false } }
    );
  }

  private handleError(err: HttpErrorResponse): AuthResponse {
    const msg = this.errorService.formatError( err);
    this.errorMessage.set(msg);
    return {token: null, message: msg, error: true}
  }

  private _login(loginRequest: LoginRequest): Observable<AuthResponse> {
    const url = `${this.baseUrl}${environment.endpoints.login}`;
    return this.http.post<AuthResponse>(url, loginRequest);
  }

  private _register( registerRequest: RegisterRequest): Observable<AuthResponse>{
    const url = `${this.baseUrl}${environment.endpoints.signup}`;
    return this.http.post<AuthResponse>(url, registerRequest);
  }
}




