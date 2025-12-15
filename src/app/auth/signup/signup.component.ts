import { Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AuthFormComponent } from '../auth-form/auth-form.component';
import { IUser } from '../auth.model';
import { RegisterRequest } from '../dto/register.request'
import { AuthService } from '../auth.service';

@Component({
  selector: 'em-signup',
  templateUrl: 'signup.component.html',
  imports: [
    RouterLink,
    MatFormFieldModule,
    AuthFormComponent
  ],
})
export class SignupComponent {

  private authService = inject( AuthService);
  private router = inject(Router);
  private readonly signupState = this.authService.signupState;

  errorState = this.signupState().error;
  message = this.signupState().message;

  constructor() {
    // Redirect user after registration 
    effect( () => {
      if( this.authService.isAuthenticated() ) {
        this.router.navigate(['/expenses']);
      }
    })
  }
 
  register(user: IUser): void {
    if( !user ) {
      //ToDo: set error message 
      return;
    }

    const { username, password, firstName, lastName } = user;
    const registerRequest: RegisterRequest = {
      fullName: [firstName,lastName].filter(Boolean).join(' ') ,
      username: username,
      password: password
    }

    this.authService.triggerSignup(registerRequest );
    console.log( 'User registered successfully: ', JSON.stringify( registerRequest ));
  }
}
