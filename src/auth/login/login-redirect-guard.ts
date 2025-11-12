import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../auth.service";


export const loginRedirectGuard: CanActivateFn = ()=>{ 
    const authService = inject(AuthService);
    const router = inject(Router);

    if( authService.isAuthenticatedSignal() ){
        router.navigate(['/expenses']);
        return false;
    }

    return true;

}