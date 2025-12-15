
export interface IUser {
    firstName? : string;
    lastName?: string;
    email?: string;
    username: string;
    password: string;
}
// support dynamic auth-form open modes
export type authFormOpenMode = 'login' | 'signup';