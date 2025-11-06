import { HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";

@Injectable(
    {
        providedIn: 'root'
    }
)
export class HttpErrorService {

    formatError( err: HttpErrorResponse ){
        return this.errorFormatter( err);
    }

    private errorFormatter(err: HttpErrorResponse){
        let errorMessage = '';
       
        if( err.error instanceof ErrorEvent){
             // client-side or network related error  
            errorMessage = `An error occured : ${err.error.message}`;
        }else {
            // backend return error status code 
            errorMessage = `Server returned code: ${err.status}, error message is ${err.statusText}`;
        }
        // Optionally we can send error  to a remote logger 
        
        return errorMessage;
    }

}