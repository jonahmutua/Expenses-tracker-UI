import { inject, Injectable } from "@angular/core";
import { HttpErrorService } from "./http-errorservice";
import { SnackbarService } from "./snackbar.service";
import { HttpErrorResponse } from "@angular/common/http";
import { throwError } from "rxjs";
import { Router } from "@angular/router";

export interface JwtPayload {
    exp?: number;
    iat?: number;
    sub?: string;
    [key: string]: any;  // allow extra custom claims
}

@Injectable(
    {
        providedIn: 'root'
    }
)
export class JwtUtilService {

    private snackbarService = inject(SnackbarService);


    // decode JWT token and return its Payload (or null if invalid) 
    decode(token: string | null){
        if(!token || !token.includes('.')){
            return null;
        }
        
        try{
            const [, payloadBase64] = token.split('.');
            const json = atob(payloadBase64);
            return JSON.parse(json);
        }catch(err){
            const errMsg = err instanceof Error ? `Invalid token format: ${err.message}` : 'Invalid token format: Unknown parsing error';
            this.errorHandler(errMsg);
            return null;
        }
    }

    // checks if token is expired 
    isExpired( token: string | null ): boolean {
        const payload =  this.decode(token);
        if( !payload || typeof payload.exp !== 'number') return true;

        const now = Math.floor(Date.now() / 1000 );
        return now > payload.exp;
    }

    // return the remaining lifetime in seconds (oor 0 if expired or invalid)
    getRemainingLifetime(token: string | null): number {
        const payload = this.decode( token );
        if(!payload?.exp ) return 0;

        const now = Math.floor(Date.now() / 1000);
        return( Math.max(0, payload.exp - now ));
    }

    // extract specific claim ( eg. username, roles)
    getClaim<T=any>(token: string, claimKey: string ): T | null {
        const payload =this.decode(token);
        return payload?.[claimKey] ?? null;
    }

    // ckecks if token looks like a JWT 
    isValidFormat(token: string | null): boolean {
        return /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(token!);
    }

    // formats and optionallly displays error
    errorHandler(err: string){
        // display a snackbar showing the error
        this.snackbarService.showError( err );
    }
}