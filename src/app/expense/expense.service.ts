import { inject, Injectable, signal, computed, effect, DestroyRef } from '@angular/core';
import { Expense, ExpenseAction, ExpenseActionResult, ExpenseState, FilterCriteria } from './expense.model';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';
import {catchError, EMPTY, filter, mergeMap, Observable, of, Subject, switchMap, tap,} from 'rxjs';
import { HttpErrorService } from '../shared/utils/http-errorservice';
import { ApiResponseDto } from '../dto/api.responsedto';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../auth/auth.service';


@Injectable({ providedIn: 'root' })
export class ExpenseService {

  private readonly http = inject(HttpClient);
  private readonly errorService = inject(HttpErrorService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);
  private readonly baseUrl = `${environment.apiBaseUrl}${environment.endpoints.expenses}`;
  private readonly action$ = new Subject<ExpenseAction>(); //action stream
  // Expenses internal state
  private readonly state = signal<ExpenseState>(  
    {
      isLoading: false,
      error: null,
      backendFiltered: [],
      expenses: [],
      filter: {}
    }
  );


  // Public computed states
  // flag to indicate wether or not we are done fetching data
  readonly isLoading = computed( () => this.state().isLoading );

  // a flag to indicate error in operatorion
  readonly error = computed<string | null>( () => this.state().error );

  readonly filteredExpenses = computed( ()=>{
    const s = this.state();

     return this.isComplexFilter( s.filter ) 
       ? s.backendFiltered
       : s.expenses.filter( e => this.matchesCriteria( e, s.filter)); // in memory filtering for simple filter 
  });

  readonly expenseCount = computed( () => this.filteredExpenses().length);
  readonly totalExpenses  = computed( () => 
    this.filteredExpenses()
      .reduce((sum, e) => sum + e.amount , 0));


  constructor() {
    
      // Auto-subscribe to action$
      this.action$.pipe(
        mergeMap(action => this.actionHandler(action)),  // process each and every action dispatched
        takeUntilDestroyed(this.destroyRef),
      ).subscribe();

    // Reload expenses if auth state changes 
    effect(()=> {
      const auth = this.authService.isAuthenticated();
      if( auth ){
        this.loadExpenses(); // dispatch laod action
      }else{
        this.patch({expenses: [], backendFiltered: [], isLoading: false}); 
      }
    })
   
  }

  // Public APIs
  loadExpenses() {
    this.action$.next({type: 'load'});
  }

  upsertExpense(expense: Expense) : void {
    this.action$.next({type: 'upsert', expense});
  }

  applyFilter( criteria: FilterCriteria) : void {
    this.action$.next({type: 'filter',  criteria})
  }

  deleteExpense(id: number) : void {
    this.action$.next({type: 'delete', id});
  }

  // helpers 
  private actionHandler(action: ExpenseAction) : Observable<ExpenseActionResult> {
    console.log("Received action:", action.type)
    switch(action.type){
      case 'load':
        this.patch({isLoading: true, error: null});
        return this.http.get<ApiResponseDto<Expense[]>>(this.baseUrl)
          .pipe(
            tap(res => this.patch({expenses: res.data, isLoading: false})),
            tap(e=> console.log("sucess run 'load'",e.data)),
            catchError( err =>{ console.log("fail run 'load action'"); return this.fail(err)} )
          );
      
      case 'filter':
        this.patch({filter: action.criteria});
        
        // if it's a simple filter, no backend call
        if(!this.isComplexFilter(action.criteria)) return EMPTY;
        
        this.patch({isLoading: true, error: null});

        return of(action.criteria).pipe(
            switchMap(creteria => this.http.post<ApiResponseDto<Expense[]>>(`${this.baseUrl}/filter`, creteria).pipe(
                      tap( res => this.patch({backendFiltered: res.data, isLoading: false})),
                      catchError( err => this.fail( err)) 
              ) 
            )
          );
      
      case 'upsert': 
          this.patch({ error: null });
          const req$ = action.expense.id 
            ? this.http.put<ApiResponseDto<Expense>>(`${this.baseUrl}/${action.expense.id}`, action.expense)
            : this.http.post<ApiResponseDto<Expense>>(`${this.baseUrl}`, action.expense);

          return req$.pipe(
            tap(res => {
              this.updateCacheAfterUpsert(res.data);
            }),
            catchError( err=> this.fail( err))
          );
      
      case 'delete':
        this.patch({error: null});
        return this.http.delete<ApiResponseDto<void>>(`${this.baseUrl}/${action.id}`)
          .pipe(
            tap(()=> this.updateCacheAfterDelete( action.id) ),
            catchError(err => this.fail(err))
          );

      default:
        this.patch({error: 'Unhandled action type'});
        return  EMPTY;
   
    }

  }

  private patch(partial: Partial<ExpenseState> ) : void {
    this.state.update( s => ({...s, ...partial}));
  }

  private fail( err: HttpErrorResponse) {
    this.patch({ error: this.handleError( err), isLoading: false});
    return EMPTY;
  }

  private isComplexFilter(criteria: FilterCriteria): boolean {
    
    if( !criteria ||  Object.keys(criteria).length === 0 ) return false;  //
   
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

    this.patch({
      expenses: [...this.state().expenses.filter( exp => exp.id !== expense.id), expense]
    });
    
  }

  // Syncs cached data with Backend DB after Deletion Operations
  private updateCacheAfterDelete(id: number): void {

    const { filter } =  this.state();
    if( this.isComplexFilter( filter )){ // if we have active complex filter and user deletes expenses -> reapply backend filter 
      this.applyFilter( filter);
      return;
    }

    this.patch({expenses: this.state().expenses.filter( e => e.id !== id)}); // if simple filter -> perfor inmemory filtering
    
  }

  private handleError(err: HttpErrorResponse): string {
    return err.error?.message || this.errorService.formatError(err);
  }
}
  