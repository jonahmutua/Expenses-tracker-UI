import { Component, computed, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';
import { DelayedErrorHandler } from '../../utils/util.delayed.error.handler';
import { AppErrorStateMatcher } from '../../utils/util.app.error.state.matcher';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { LoginRequest } from './login.model';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'et-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
  ],
})
export class LoginComponent {
  fb: FormBuilder = inject(FormBuilder);
  authService = inject(AuthService);
  router = inject(Router);

  loginErrorSignal = computed(()=>{
    const resp = this.authService.loginResponse();
    return resp.error ? resp.message : null;
  });


  loginForm = this.fb.group({
    //email: ['', [Validators.required, Validators.email]], // unused
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  constructor() {
    // Redirect if already authenticated
    effect(() => {
      const {token, error} = this.authService.loginResponse();

      // redirect on login success  ( tokenn exists and no error)
      if (token && !error) {
        console.log("Logincomponent | effect | login succeess.")
        localStorage.removeItem('auth_token');
        this.router.navigate(['/expenses']); /* can navigate to Home page */
      }else{
        console.log("Logincomponent | effect | login fail.", token, error)
      }

    });
  }
  // delay to show errors
  handler = new DelayedErrorHandler(this.loginForm);

  emailErrorMatcher = new AppErrorStateMatcher({
    showErrorsSignal: this.handler.getErrorSignal('email'),
  });
  passwordErrorMatcher = new AppErrorStateMatcher({
    showErrorsSignal: this.handler.getErrorSignal('password'),
  });
  usernameErrorMatcher = new AppErrorStateMatcher({
    showErrorsSignal: this.handler.getErrorSignal('username'),
  });

  login(): void {
    // if the form is invalid or the page is loading, we do not initiate new request
    if (this.loginForm.invalid || this.authService.isLoading() ) return;

    const loginRequest: LoginRequest = this.loginForm.value as LoginRequest;

    this.authService.login(loginRequest);

    this.loginForm.reset();
    
    console.log('Login request sent for user: ', JSON.stringify(loginRequest));
  }
}
