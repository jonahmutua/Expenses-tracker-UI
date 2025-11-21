import { Routes } from '@angular/router';
import { LoginComponent } from '../auth/login/login.component';
import { SignupComponent } from '../auth/signup/signup.component';
import { ExpenseListComponent } from '../expense/expense-list/expense-list.component';
import { authGuard } from '../auth/auth-guard';
import { HomeComponent, } from './home/home.component';
import { loginRedirectGuard } from '../auth/login/login-redirect-guard';
import { ReportComponent } from '../expense/expense-report/expense-report';

export const routes: Routes = [
    {path: 'login', component: LoginComponent, canActivate: [loginRedirectGuard]},
    {path: 'register', component: SignupComponent},

    {path: 'home',
        component: HomeComponent,
        canActivate: [authGuard],
        children: [
            {path: '', redirectTo: 'expenses', pathMatch: 'full' }, // default path in home 
            {path: 'expenses', component: ExpenseListComponent},
            {path: 'report', component: ReportComponent},
        ]
    },

    { path: '', redirectTo: 'home', pathMatch: 'full' }, // top-level redirect to home
    { path: '**', redirectTo: 'home' }, // catch-all

    /*
    {path: 'expenses', canActivate: [authGuard], loadComponent: ()=> import('../expense/expense-list/expense-list.component').then(m=>m.ExpenseListComponent)},
    
        / Optional: group multiple protected routes under a parent
        {
            path: 'dashboard',
            canActivate: [authGuard],
            children: [
            { path: 'reports', loadComponent: () => import('./reports/reports.component').then(m => m.ReportsComponent) },
            { path: 'settings', loadComponent: () => import('./settings/settings.component').then(m => m.SettingsComponent) },
            ],
        },

    
    {path: '', redirectTo: 'home', pathMatch: 'full'}, /* todo: instead redirect to Homepage */
    //{path: '**', redirectTo: 'login'}, /* Optional 404 route */
];
