import { inject, Injectable, signal } from '@angular/core';
import { Expense } from '../models/expense/expense.model';
import { ExpenseData } from './expense.data';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { catchError, EMPTY, Observable, of } from 'rxjs';
import { HttpErrorService } from '../utils/http-errorservice';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ExpenseService {
  //expenses: Expense[] = [];
  expenses = signal<Expense[]>([]);

  http = inject(HttpClient);

  errorService = inject(HttpErrorService);

  baseUrl = `${environment.apiBaseUrl}`;

  constructor() {
    this.loadExpenses();
  }

  // TODO: Call HTPPClient
  loadExpenses(): void {
    //const data = ExpenseData.fetchExpenses(); // in memory mock data
    // this.expenses.set( data );
    this.getExpenses().subscribe({
      next: (data) => {
        console.log('Expenses fetched:', data);
        this.expenses.set(data);
      },
      error: (err) => console.error('Failed to load expenses:', err),
    });
  }

  getExpenses(): Observable<any> {
    const targetUrl: string = `${this.baseUrl}${environment.endpoints.expenses}`;
    return this.http.get(targetUrl).pipe(
      catchError((err) => {
        const errMsg = this.errorHander(err);
        console.log('Error | getExpenses() | ExpenseService class', errMsg);
        return of([]);
      })
    );
  }

  // Add or update an expense
  upsertExpense(expense: Expense) {
    this.expenses.update((current) => {
      const index = current.findIndex((e) => e.id === expense.id);

      if (index >= 0) {
        // Update existing
        return [...current.slice(0, index), expense, ...current.slice(index + 1)];
        // Optionally, call your backend API to persist the change
        // this.http.put(`/api/expenses/${expense.id}`, expense).subscribe();
      } else {
        // Add new
        const newExpense = { ...expense, id: Math.max(0, ...current.map((e) => e.id ?? 0)) + 1 };
        return [...current, newExpense];

        // Optionally, call your backend API to persist new Expense
        // this.http.(`/api/expenses/$`, expense).subscribe();
      }
    });
  }

  // Delete an expense
  deleteExpense(expense: Expense) {
    this.expenses.update((current) => current.filter((e) => e.id !== expense.id));
  }

  private errorHander(err: HttpErrorResponse): string {
    return this.errorService.formatError(err);
  }
}
