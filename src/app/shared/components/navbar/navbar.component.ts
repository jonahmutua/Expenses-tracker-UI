import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatSidenavModule,
    MatListModule
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
onMenuToggle() {
throw new Error('Method not implemented.');
}

  isSidenavOpen = false;

  authService = inject(AuthService);

  authLink = computed(() => this.authService.isAuthenticated() ? '/expenses' : '/login');
  authLabel = computed(() => this.authService.isAuthenticated() ? 'Logout' : 'Login');

  onAuthClick() {
    this.authService.isAuthenticated()  && this.authService.logout();
  }
}
