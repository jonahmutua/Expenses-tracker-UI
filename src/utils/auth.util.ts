import { environment } from "../environments/environment";

/* Authentication is not required to access thse endpoints */
export const PUBLIC_ENDPOINTS: string[] = [
    environment.endpoints.login,
    environment.endpoints.signup,
]


export function isPublicEndpoint(url:string): boolean {
    return PUBLIC_ENDPOINTS.some( endpoint => url.includes(endpoint));
}