import { Component, computed, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    MatToolbarModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class HomeComponent {
  
  currentDate = new Date();

  authService = inject(AuthService);

  private router = inject(Router);

  // auth states 
  authLabel = computed( () => this.authService.isAuthenticated() ? 'Logout' : 'Login' );
  authIcon  = computed( () => this.authService.isAuthenticated() ? 'logout' : 'login');
  userName = computed( () => this.authService.username() );


  onAuthAction(): void {
    if(this.authService.isAuthenticated()){
      this.authService.logout();
      return;
    }
    this.router.navigate(['/login']);
  }

}
