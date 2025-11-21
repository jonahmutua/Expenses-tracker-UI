import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "./auth.service";

export const authGuard: CanActivateFn = () => {
    const authService = inject(AuthService)
    const router = inject( Router);

    // If we are authnticated 
    if( authService.isAuthenticated() ){
        return true;
    }

    // We aren't authenticated, we redirect user
    return router.navigate(['/login']);
};