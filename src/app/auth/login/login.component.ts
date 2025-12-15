import { Component, computed, effect, inject } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field'
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { RouterLink } from '@angular/router';
import { LoginRequest } from '../dto/login.request';
import { AuthFormComponent } from '../auth-form/auth-form.component';
import { IUser } from '../auth.model';

@Component({
  selector: 'et-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  imports: [
    RouterLink,
    MatFormFieldModule,
    AuthFormComponent,
  ],
})
export class LoginComponent {
 
  authService = inject(AuthService);
  router = inject(Router);

  loginErrorSignal = computed( () => this.authService.errorMessage() );

  constructor() {
    //=== WATCH FOR LOGINRESPONSE SIGNAL AND REACT TO CHANGES ===//
    effect(() => {
      

      //=== REDIRECT AFTER SUCCESSFUL LOGIN ==+//
      if ( this.authService.isAuthenticated() )  {
        //this.loginForm.reset();
        this.router.navigate(['/expenses']); /* TODO: best  to navigate to Home page */
      }

    });
  }


  login(user: IUser): void {
    // FORM IS  LOADING - DO NOTHING
    if ( this.authService.isLoading() ) return;

    const {username, password} = user;

    const loginRequest: LoginRequest = {
      username: username,
      password: password};
    
    // reactive mode - ( signal based )
    this.authService.triggerLogin(loginRequest);

    //== CLASSICAL OBSERVABLE APPROACH - MANUALLY SUBSCRIBE AND UNSUBSCRIBE ==//
    //this.authService.login( loginRequest).subscribe();

    console.log('Login request sent for user: ', JSON.stringify(loginRequest));
  }
}
