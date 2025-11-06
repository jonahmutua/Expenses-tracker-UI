export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse{
    token: string | null;
    message: string | null; // error or info message
    error: boolean; // error flag
}