export interface AuthResponse {
    token: string | null;
    message: string | null; // error or info message
    error: boolean; // error flag
}