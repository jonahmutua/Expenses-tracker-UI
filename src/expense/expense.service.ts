import { inject, Injectable, signal } from '@angular/core';
import { Expense } from './expense.model';
import { ExpenseData } from './expense.data';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import {
  BehaviorSubject,
  catchError,
  EMPTY,
  finalize,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import { HttpErrorService } from '../utils/http-errorservice';
import { HttpErrorResponse } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root',
})
export class ExpenseService {
  //expenses: Expense[] = [];
  //expenses = signal<Expense[]>([]);

  http = inject(HttpClient);

  errorService = inject(HttpErrorService);

  baseUrl = `${environment.apiBaseUrl}${environment.endpoints.expenses}`;

  // === SUbjects for triggering operations === /
  reloadTrigger$ = new Subject<void>();
  upsertTrigger$ = new Subject<Expense>();
  deleteTrigger$ = new Subject<number>();

  // == loading and error states == //
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  operationInProgress = signal<boolean>(false);
  operationError = signal<string | null>(null);

  // === Observable stream for loading expenses ===/
  private expenses$ = this.reloadTrigger$.pipe(
    tap(() => {
      this.isLoading.set(true);
      this.error.set(null);
    }),
    switchMap(() => {
      return this.http.get<Expense[]>(this.baseUrl).pipe(
        shareReplay({bufferSize: 1, refCount: true}), // === Cache last result === //
        tap(() => {
          this.isLoading.set(false);
          this.error.set(null);
        }),
        catchError((err) => {
          const errMsg = this.errorHandler(err);
          this.error.set(`Failed to load expenses: ${errMsg}`);
          this.isLoading.set(false);
          return of([] as Expense[]) ;
        })
      );
    })
  );

  // === Observable stream for upsert Operation === //
  private upsertResult$ = this.upsertTrigger$.pipe(
    tap(()=> {
      this.operationInProgress.set(true),
      this.operationError.set(null)
    }),
    switchMap((expense)=>{
      console.log("Expense ID: ", expense.id);
      const isUpdate = expense.id !== 0 && expense.id !== undefined && expense.id !== null ; // check wether we update or creat a new expns
      const req$ = isUpdate ? this.http.put(`${this.baseUrl}/${expense.id}`, expense) : this.http.post(this.baseUrl, expense);
      return req$.pipe(
        tap((savedExpense) => {
          this.operationInProgress.set(false);
          this.operationError.set(null);
          this.reloadTrigger$.next(); // === Trigger reload for refresh list
        }),
        catchError((error)=>{
          const errMsg = this.errorHandler( error );
          this.operationError.set(`Failed to save expense | {${expense}} : ${errMsg} `);
          this.operationInProgress.set(false);
          return EMPTY;
        })
      )
    }),
  );

  // === Observable stream for delete operation === //
  deleteResult$ = this.deleteTrigger$.pipe(
    tap(()=>{
      this.operationInProgress.set(true);
      this.operationError.set(null);
    }),
    switchMap((id)=>{
      return this.http.delete(`${this.baseUrl}/${id}`).pipe(
        tap(()=>{
          this.operationInProgress.set(false);
          this.operationError.set(null);
          this.reloadTrigger$.next(); // === Trigger reload for refresh list
        }),
        catchError((error)=>{
          const errMsg = this.errorHandler(error);
          this.operationError.set(`Error occured while deleting expense id: ${id}, ${errMsg}`);
          return EMPTY;
        })
      )
    }),

  );

  // === Convert observables to signal === //
  expenses = toSignal(this.expenses$, { initialValue: [] });
  upsertSubscription = toSignal(this.upsertResult$);
  deleteSubscrition  = toSignal(this.deleteResult$);

  constructor() {
    // === Trigger reload of expenses === //
    //this.loadExpenses();
  }

  // === Trigger reload of expenses === //
  loadExpenses(): void {
    //const data = ExpenseData.fetchExpenses(); // in memory mock data
    // this.expenses.set( data );
    // this.getExpenses().subscribe({
    //   next: (data) => {
    //     console.log('Expenses fetched:', data);
    //     this.expenses.set(data);
    //   },
    //   error: (err) => console.error('Failed to load expenses:', err),
    // });

    this.reloadTrigger$.next();
  }

  // getExpenses(): Observable<any> {
  //   const targetUrl: string = `${this.baseUrl}${environment.endpoints.expenses}`;
  //   return this.http.get(targetUrl).pipe(
  //     catchError((err) => {
  //       const errMsg = this.errorHander(err);
  //       console.log('Error | getExpenses() | ExpenseService class', errMsg);
  //       return of([]);
  //     })
  //   );
  // }

  // Add or update an expense
  upsertExpense(expense: Expense) {

    this.upsertTrigger$.next(expense);

    // this.expenses.update((current) => {
    //   const index = current.findIndex((e) => e.id === expense.id);
    //   if (index >= 0) {
    //     // Update existing
    //     return [...current.slice(0, index), expense, ...current.slice(index + 1)];
    //     // Optionally, call your backend API to persist the change
    //     // this.http.put(`/api/expenses/${expense.id}`, expense).subscribe();
    //   } else {
    //     // Add new
    //     const newExpense = { ...expense, id: Math.max(0, ...current.map((e) => e.id ?? 0)) + 1 };
    //     return [...current, newExpense];
    //     // Optionally, call your backend API to persist new Expense
    //     // this.http.(`/api/expenses/$`, expense).subscribe();
    //   }
    // });
    
  }

  // Delete an expense
  deleteExpense(expense: Expense) {
    // === expesne ID msut be valid === //
    if( !expense.id ){
      const error = 'Cannot delete an expense without ID';
      this.operationError.set(error);
      return;
    }

    this.deleteTrigger$.next(expense.id);

  }

  /**
   * One-off operation - keep it as an Observable 
   * @param id - expense ID 
   * @returns - Expense -success or Null -fail or Expense by ID does not exist
   */
  getExpenseById(id: number): Observable<Expense | null> {
    return this.http.get<Expense | null>(`${this.baseUrl}/${id}}`).pipe(
      catchError((error)=>{
        const errMsg = this.errorHandler( error);
        this.operationError.set(`Failed to fetch expense with ID ${id}, ${errMsg}`);
        return EMPTY;
      })
    )
  }

  private errorHandler(err: HttpErrorResponse): string {
    return this.errorService.formatError(err);
  }
}
