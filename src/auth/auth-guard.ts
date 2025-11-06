import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "./auth.service";

export const authGuard: CanActivateFn = () => {
    const authService = inject(AuthService)
    const router = inject( Router);

    // if we are authenticated we return true else we redirect to login page
    return authService.isAuthenticatedSignal() ?  true : router.createUrlTree(['/login'])

    // if( authService.isAuthenticatedSignal() ){
    //     return true;
    // }

    // // redirect to login
    // router.navigate(['/login']);
    // return false;
};