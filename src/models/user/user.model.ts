/* Login request */

export interface LoginRequest {
    email: string;
    password: string
}

/* Signup Request */
export interface SignupRequest {
    firstName:    string;   
    lastName:    string;   
    email:       string;    
    password:    string;    
    confirmPassword: string;
}