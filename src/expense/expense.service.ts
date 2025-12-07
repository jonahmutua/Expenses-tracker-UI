import { inject, Injectable, signal, computed } from '@angular/core';
import { Expense, FilterCriteria } from './expense.model';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../environments/environment';
import {
  catchError,
  EMPTY,
  map,
  Observable,
  shareReplay,
  Subject,
  switchMap,
  tap,
  debounceTime,
  finalize,
} from 'rxjs';
import { HttpErrorService } from '../utils/http-errorservice';
import { ApiResponseDto } from '../dto/api.responsedto';
import { toSignal } from '@angular/core/rxjs-interop';
import { PaginationParams } from '../models/user/user.model';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private readonly http = inject(HttpClient);
  private readonly errorService = inject(HttpErrorService);
  private readonly baseUrl = `${environment.apiBaseUrl}${environment.endpoints.expenses}`;

  // ===== TRIGGERS =====
  private readonly loadTrigger$ = new Subject<void>();
  private readonly filterTrigger$ = new Subject<FilterCriteria>();
  private readonly upsertTrigger$ = new Subject<Expense>();
  private readonly deleteTrigger$ = new Subject<number>();

  // ===== STATE SIGNALS =====
  private readonly isLoadingState = signal<boolean>(false);
  private readonly errorState = signal<string | null>(null);
  private readonly operationInProgressState = signal<boolean>(false);
  private readonly operationErrorState = signal<string | null>(null);
  private readonly filterCriteriaState = signal<FilterCriteria>({});
  private readonly paginationState = signal<PaginationParams>({ page: 1, pageSize: 50 });
  private readonly allExpensesState = signal<Expense[]>([]);

  // ===== PUBLIC COMPUTED SIGNALS =====
  readonly isLoading = computed(() => this.isLoadingState());
  readonly error = computed(() => this.errorState());
  readonly operationInProgress = computed(() => this.operationInProgressState());
  readonly operationError = computed(() => this.operationErrorState());
  readonly filterCriteria = computed(() => this.filterCriteriaState());
  readonly pagination = computed(() => this.paginationState());

  readonly filteredExpenses = computed(() => {
    const criteria = this.filterCriteriaState();
    const expenses = this.allExpensesState();

    if (!criteria || Object.keys(criteria).length === 0) {
      return expenses;
    }

    // Complex filters (backend) take precedence
    if (this.isComplexFilter(criteria)) {
      return this.backendFilteredExpenses();
    }

    // Simple filters (frontend)
    return expenses.filter(exp => this.matchesCriteria(exp, criteria));
  });

  readonly expenseCount = computed(() => this.filteredExpenses().length);
  readonly totalExpenses = computed(() =>
    this.filteredExpenses().reduce((sum, exp) => sum + exp.amount, 0)
  );

  // ===== BACKEND FILTERED DATA =====
  private readonly filteredExpenses$$ = this.filterTrigger$.pipe(
    debounceTime(300),
    tap(criteria => {
      this.filterCriteriaState.set(criteria);
      this.isLoadingState.set(true);
      this.errorState.set(null);
    }),
    switchMap(criteria =>
      this.http.post<ApiResponseDto<Expense[]>>(`${this.baseUrl}/filter`, criteria).pipe(
        map(response => response.data),
        tap(() => this.isLoadingState.set(false)),
        catchError(err => {
          this.errorState.set(`Filter failed: ${this.handleError(err)}`);
          this.isLoadingState.set(false);
          return [];
        })
      )
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  private readonly backendFilteredExpenses = toSignal(this.filteredExpenses$$, {
    initialValue: [] as Expense[],
  });

  // ===== AUTO-SUBSCRIPTIONS =====
  private readonly loadSubscription = toSignal(this.createLoadStream());
  private readonly upsertSubscription = toSignal(this.createUpsertStream());
  private readonly deleteSubscription = toSignal(this.createDeleteStream());


  loadExpenses(): void {
    this.loadTrigger$.next();
  }

  applyFilter(criteria: FilterCriteria): void {
    if (this.isComplexFilter(criteria)) {
      this.filterTrigger$.next(criteria);
    } else {
      this.filterCriteriaState.set(criteria);
    }
  }

  clearFilter(): void {
    this.filterCriteriaState.set({});
  }

  setPagination(page: number, pageSize: number): void {
    this.paginationState.set({ page, pageSize });
  }

  upsertExpense(expense: Expense): void {
    this.upsertTrigger$.next(expense);
  }

  deleteExpense(id: number): void {
    if (!id) {
      this.operationErrorState.set('Cannot delete expense without ID');
      return;
    }
    this.deleteTrigger$.next(id);
  }


  private isComplexFilter(criteria: FilterCriteria): boolean {
    if( !criteria ) return false;
   
    return !!(
      (criteria.startDate || criteria.endDate) ||
      (criteria.minAmount !== undefined && criteria.minAmount > 0) ||
      (criteria.maxAmount !== undefined && criteria.maxAmount > 0)
    );
  }

  private matchesCriteria(expense: Expense, criteria: FilterCriteria): boolean {

    if (criteria.searchTerm) {
      const term = criteria.searchTerm.toLowerCase();
      if (!expense.category?.toLowerCase().includes(term)) {
        return false;
      }
    }

    if (criteria.category && expense.category !== criteria.category ) return false;
  
    if(criteria.expenseType && expense.expenseType !== criteria.expenseType) return false;
     
    return true;
  }

  private updateCacheAfterUpsert(expense: Expense): void {
    const current = this.allExpensesState();
    const exists = current.some(e => e.id === expense.id);

    if (!exists) {
      this.allExpensesState.set([...current, expense]);
    } else {
      this.allExpensesState.set(current.map(e => (e.id === expense.id ? expense : e)));
    }
  }

  // Syncs cached data with Backend DB after Deletion Operations
  private updateCacheAfterDelete(id: number): void {
    const filterCreteria = this.filterCriteriaState();
    
    // if user had applied complex filter prior to expense deletion, perform backend filtering 
    if(this.isComplexFilter(filterCreteria)){
      this.filterTrigger$.next( filterCreteria);
      return;
    }

    // simple filter , perform filtering on cached data
    this.allExpensesState.set(this.allExpensesState().filter(e => e.id !== id));
  }

  private handleError(err: HttpErrorResponse): string {
    return err.error?.message || this.errorService.formatError(err);
  }

  // ===== STREAM CREATION =====
  private createLoadStream(): Observable<Expense[]> {
    return this.loadTrigger$.pipe(
      tap(() => {
        this.isLoadingState.set(true);
        this.errorState.set(null);
      }),
      switchMap(() =>
        this.http.get<ApiResponseDto<Expense[]>>(this.baseUrl).pipe(
          map(response => response.data),
          tap(data => {
            this.allExpensesState.set(data);
            this.isLoadingState.set(false);
          }),
          catchError(err => {
            this.errorState.set(`Failed to load expenses: ${this.handleError(err)}`);
            this.isLoadingState.set(false);
            return [];
          })
        )
      ),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  private createUpsertStream(): Observable<Expense> {
    return this.upsertTrigger$.pipe(
      tap(() => {
        this.operationInProgressState.set(true);
        this.operationErrorState.set(null);
      }),
      switchMap(expense => {
        const isUpdate = !!expense.id;
        const request$ = isUpdate
          ? this.http.put<ApiResponseDto<Expense>>(`${this.baseUrl}/${expense.id}`, expense)
          : this.http.post<ApiResponseDto<Expense>>(this.baseUrl, expense);

        return request$.pipe(
          map(response => response.data),
          tap(savedExpense => {
            this.updateCacheAfterUpsert(savedExpense);
            this.operationInProgressState.set(false);
          }),
          catchError(err => {
            this.operationErrorState.set(`Failed to save: ${this.handleError(err)}`);
            this.operationInProgressState.set(false);
            return EMPTY;
          })
        );
      })
    );
  }

  private createDeleteStream(): Observable<void> {
    return this.deleteTrigger$.pipe(
      tap(() => {
        this.operationInProgressState.set(true);
        this.operationErrorState.set(null);
      }),
      switchMap(id =>
        this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
          tap(() => {
            this.updateCacheAfterDelete(id);
          }),
          catchError(err => {
            this.operationErrorState.set(`Delete failed: ${this.handleError(err)}`);
            return EMPTY;
          }),
          finalize(()=>this.operationInProgressState.set(false))
        )
      )
    );
  }
}




