import { Routes } from '@angular/router';
import { LoginComponent } from '../auth/login/login.component';
import { SignupComponent } from '../auth/signup/signup.component';
import { ExpenseListComponent } from '../expense/expense-list/expense-list.component';
import { authGuard } from '../auth/auth-guard';

export const routes: Routes = [
    {path: 'login', component: LoginComponent},
    {path: 'register', component: SignupComponent},
    {path: 'expenses', canActivate: [authGuard], loadComponent: ()=> import('../expense/expense-list/expense-list.component').then(m=>m.ExpenseListComponent)},
    /*
        / Optional: group multiple protected routes under a parent
        {
            path: 'dashboard',
            canActivate: [authGuard],
            children: [
            { path: 'reports', loadComponent: () => import('./reports/reports.component').then(m => m.ReportsComponent) },
            { path: 'settings', loadComponent: () => import('./settings/settings.component').then(m => m.SettingsComponent) },
            ],
        },

    */
    {path: '', redirectTo: 'login', pathMatch: 'full'}, /* todo: instead redirect to Homepage */
    {path: '**', redirectTo: 'login'}, /* Optional 404 route */
   
];
