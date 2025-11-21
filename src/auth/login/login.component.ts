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

  loginErrorSignal = computed( () => this.authService.errorMessage() );


  loginForm = this.fb.group({
    //email: ['', [Validators.required, Validators.email]], // unused
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  constructor() {
    //=== WATCH FOR LOGINRESPONSE SIGNAL AND REACT TO CHANGES ===//
    effect(() => {
      

      //=== REDIRECT AFTER SUCCESSFUL LOGIN ==+//
      if ( this.authService.isAuthenticated() )  {
        this.loginForm.reset();
        this.router.navigate(['/expenses']); /* TODO: best  to navigate to Home page */
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
    // EITHER FORM IS INVALID OR LOADING - DO NOTHING
    if (this.loginForm.invalid || this.authService.isLoading() ) return;

    const loginRequest: LoginRequest = this.loginForm.value as LoginRequest;
    
    // reactive mode - ( signal based )
    this.authService.triggerLogin(loginRequest);

    //== CLASSICAL OBSERVABLE APPROACH - MANUALLY SUBSCRIBE AND UNSUBSCRIBE ==//
    //this.authService.login( loginRequest).subscribe();

    console.log('Login request sent for user: ', JSON.stringify(loginRequest));
  }
}
