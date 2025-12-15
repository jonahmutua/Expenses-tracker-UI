import { Component, computed, inject, signal } from "@angular/core";
import { MatSidenavModule } from "@angular/material/sidenav";
import { ToolbarComponent } from "../app-toolbar/app-toolbar.component";
import { Router, RouterModule, RouterOutlet } from "@angular/router";
import { MatToolbar } from "@angular/material/toolbar";
import { MatList, MatListItem, MatNavList } from "@angular/material/list";
import { BreakpointObserver, BreakpointState } from "@angular/cdk/layout";
import { MatIcon } from "@angular/material/icon";
import { AuthService } from "../../../auth/auth.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

const SMALL_WIDTH_BREAKPOINT = 720;

@Component({
    selector: 'app-sidebar',
    standalone: true,
    templateUrl: 'app-sidebar.component.html',
    styleUrls: ['app-sidebar.component.css'],
    imports: [MatSidenavModule, ToolbarComponent, RouterModule, RouterOutlet, MatToolbar, MatList, MatListItem, MatNavList, MatIcon]
})
export class SidebarComponent  {

    private authService = inject( AuthService);
    private router = inject(Router);
    readonly isSmallScreen = signal(false);

    isAuthenticated = computed<boolean>( () => this.authService.isAuthenticated() );
    authLabel = computed<string>(() =>this.isAuthenticated() ? 'Logout' : 'Login');
    authIcon  = computed<string>(() =>this.isAuthenticated() ? 'logout' : 'login' );
    

    constructor(private breakPointObserver: BreakpointObserver){
        this.breakPointObserver
            .observe([ `(max-width: ${SMALL_WIDTH_BREAKPOINT}px)` ])
            .pipe( takeUntilDestroyed()) // auto-sub
            .subscribe( (state: BreakpointState) => this.isSmallScreen.set(state.matches));
    }

    onAuthAction(): void {
        if( this.isAuthenticated() ){
            this.authService.logout() ;
        }  
        this.router.navigate(['/home/login']);
    }

}