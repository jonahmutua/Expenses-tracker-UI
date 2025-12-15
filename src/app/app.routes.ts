import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { SignupComponent } from './auth/signup/signup.component';
import { ExpenseListComponent } from './expense/expense-list/expense-list.component';
import { authChildGuard, authGuard } from './auth/auth-guard';
import { HomeComponent, } from './home/home.component';
import { loginRedirectGuard } from './auth/login/login-redirect-guard';
import { ReportComponent } from './expense/expense-report/expense-report';
import { MainContentComponent } from './shared/components/app-main-content/app-main-content.component';
import { Component } from '@angular/core';

export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' }, // top-level redirect to home
    {path: 'home', 
        component: HomeComponent,
        children: [
            {path: '' , component: MainContentComponent},
            {path: 'login', component: LoginComponent},
            {path: 'expenses', component: ExpenseListComponent},
            {path: '**', redirectTo: 'home' }]},

    // {path: 'login', component: LoginComponent, canActivate: [loginRedirectGuard]},
    // {path: 'register', component: SignupComponent},
    // {path: 'home',
    //     component: HomeComponent,
    //     canActivate: [authGuard],
    //     canActivateChild: [authChildGuard],
    //     children: [
    //         {path: '', redirectTo: 'expenses', pathMatch: 'full' }, // default path in home 
    //         {path: 'reports', component: ReportComponent},
    //         {path: 'expenses', component: ExpenseListComponent},
    //     ]
    // },

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
