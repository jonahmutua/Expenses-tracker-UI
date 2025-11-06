import { Component, computed, inject, signal } from '@angular/core';
import { Validators, FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DelayedErrorHandler } from '../../utils/util.delayed.error.handler';
import { AppErrorStateMatcher } from '../../utils/util.app.error.state.matcher';
import { MatCard } from '@angular/material/card';
import { MatCardModule } from '@angular/material/card';
import { CustomValidators } from '../../utils/validators/utils.custom.validator';
import { RouterLink } from '@angular/router';
import { SignupRequest } from '../../models/user/user.model';

@Component({
  selector: 'et-signup',
  templateUrl: 'signup.component.html',
  styleUrl: './signup.component.css',
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatCardModule,
    MatCard,
    RouterLink
  ],
})
export class SignupComponent {
  fb: FormBuilder = inject(FormBuilder);

  signupForm = this.fb.group(
    {
      firstName:        ['', [Validators.required, CustomValidators.hasWhiteSpace]],
      lastName:         ['', [Validators.required, CustomValidators.hasWhiteSpace]],
      email:            ['', [Validators.required, Validators.email ]],
      password:         ['', [Validators.required]],
      confirmPassword:  ['', [Validators.required]],
    },
    {
      validators: CustomValidators.matchFields('password', 'confirmPassword'),
    }
  );

  handler = new DelayedErrorHandler(this.signupForm);

  emailErrorMatcher = new AppErrorStateMatcher({
    showErrorsSignal: this.handler.getErrorSignal('email'),
  });
  firstNameErrorMatcher = new AppErrorStateMatcher({
    showErrorsSignal: this.handler.getErrorSignal('firstName'),
  });
  lastNameErrorMatcher = new AppErrorStateMatcher({
    showErrorsSignal: this.handler.getErrorSignal('lastName'),
  });
  passwordErrorMatcher = new AppErrorStateMatcher({
    showErrorsSignal: this.handler.getErrorSignal('password'),
  });
  passwordMismatchErrorMatcher = new AppErrorStateMatcher({
    showErrorsSignal: this.handler.getErrorSignal('confirmPassword'),
  });

  register(): void {
    if( this.signupForm.invalid ) return;

    const user: SignupRequest = this.signupForm.value as SignupRequest;
    // authService.register( user );
    console.log( 'User registered successfully: ', JSON.stringify( user ));
    
  }
}
