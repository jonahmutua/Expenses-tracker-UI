import { inject } from "@angular/core";
import { CanActivateFn, CanActivateChildFn, Router } from "@angular/router";
import { AuthService } from "./auth.service";

// shared check function 
function checkGaurd(): boolean | import('@angular/router').UrlTree {
    const authService = inject(AuthService);
    const router = inject(Router);

    if(authService.isAuthenticated() ){
        return true;
    }

    return router.parseUrl('/login'); // redirect if not logged
}

// Parent Guard 
export const authGuard: CanActivateFn = () => checkGaurd();

// Child Guard 
export const authChildGuard: CanActivateChildFn = () => checkGaurd();