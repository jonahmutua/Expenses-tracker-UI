import { Component, computed, effect, inject, Injector, runInInjectionContext, Signal, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { Expense, ExpenseCategory, ExpenseFilterForm, ExpenseTypeEnum, ExpenseTypeFilter, FilterCriteria, IncomeCategory } from '../expense.model';
import { SnackbarService } from '../../utils/snackbar.service';
import { ExpenseService } from '../../expense/expense.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ExpenseEditDialogComponent } from '../../expense/expense-edit-dialog/expense-edit-dialog.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, UnsubscriptionError } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { RouterModule, Router } from '@angular/router';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { DateUtilService } from '../../utils/date-util.service';


@Component({
  selector: 'app-my-transactions',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSidenavModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatTableModule,
    MatListModule,
    MatIconModule,
    MatDialogModule,
    RouterModule,
    MatDatepickerModule,
    MatNativeDateModule,
],
  templateUrl: './expense-list.component.html',
  styleUrls: ['./expense-list.component.css'],
  encapsulation: ViewEncapsulation.None , /* let us override angular material default syles */

})
export class ExpenseListComponent {
  expenseService = inject(ExpenseService);
  snackbarService = inject(SnackbarService);
  authService = inject(AuthService);
  dateUtilService = inject(DateUtilService);
  router = inject(Router);
  private dialog = inject(MatDialog);
  private injector = inject(Injector);

  fb = inject(FormBuilder)

  filterForm : FormGroup<ExpenseFilterForm> = this.fb.group<ExpenseFilterForm>({
    type: this.fb.control(ExpenseTypeFilter.ALL, {nonNullable: true}),

    category: this.fb.control('', {nonNullable: true}),
    fromDate: this.fb.control<Date | null>(null),
    toDate: this.fb.control<Date | null> (null) 
  });

  typeCtrl = this.filterForm.get('type')! as FormControl<ExpenseTypeFilter >;
  categoryCtrl = this.filterForm.get('category')! as FormControl<ExpenseCategory | IncomeCategory | ''>;
  fromDateCtrl = this.filterForm.get('fromDate')! as FormControl<Date | null> ;
  toDateCtrl = this.filterForm.get('toDate')! as FormControl<Date | null>;

  // convert form values changes to signal 
  filterValues = toSignal( this.filterForm.valueChanges, { initialValue: this.filterForm.getRawValue()});


  selectedExpenseType = computed( ()=> this.filterValues().type);

  selectedCategory = computed(()=> this.filterValues().category);

  selectedStartDate = computed(()=> this.filterValues().fromDate);

  selectedEndDate = computed(()=> this.filterValues().toDate);

  // Expenses type list 
  expenseTypeOptions = signal<ExpenseTypeFilter[]>(Object.values(ExpenseTypeFilter));

  // Category Options ( popullaates Dynamically based on expense-Type )
  categoryOptions = computed( ()=> {
    if( this.selectedExpenseType() === ExpenseTypeFilter.EXPENSE )  return Object.values(ExpenseCategory);
    if( this.selectedExpenseType() === ExpenseTypeFilter.INCOME )  return Object.values(IncomeCategory);
    return [];
  });

  // UI data
  displayedColumns: string[] = ['type', 'category', 'amount', 'lastUpdatedAt', 'note', 'actions'];
  
  // States 
  editedExpense = signal<Expense | null>(null);

  filteredExpenses = computed( () => this.expenseService.filteredExpenses() );
  

  constructor() {
    this.expenseService.loadExpenses();
  
    // Watch when expense Type Option changes and sync with form 
    effect( () => {
      this.selectedExpenseType();
      // Reset category when switching type 
      this.filterForm.get('category')?.setValue('');
    });

    // Apply filter when form values change
    effect(() => {
      this.filterValues();
      this.applyFilter();
    })

  }

  // === Dialog Management ===

  openEditDialog(expense: Expense): void {
    const dialogRef = this.dialog.open(ExpenseEditDialogComponent, {
      width: '400px',
      data: { mode: 'edit', expense: { ...expense } },
    });

    this.handleDialogResult(dialogRef.afterClosed());
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(ExpenseEditDialogComponent, {
      width: '400px',
      data: { mode: 'add' },
    });
    this.handleDialogResult(dialogRef.afterClosed());
  }

  private handleDialogResult(dialogClosed$: Observable<Expense | null>): void {
    runInInjectionContext(this.injector, () => {
      const closedSignal = toSignal<Expense | null>(dialogClosed$, { initialValue: null });

      effect(() => {
        const result = closedSignal();
        if (result) {
          console.log("Exepnse:", result)
          this.editedExpense.set(result);
          this.expenseService.upsertExpense(result);
        }
      });
    });
  }

  deleteExpense(expense: Expense): void { 
    if(confirm("Are you sure you want to delete this expense? This action cannot be undone.")){
      this.expenseService.deleteExpense(expense.id?? 0);
    }  
  }


  applyFilter(): void {
    const filterCriteria: FilterCriteria = this.buildFilter();
    this.expenseService.applyFilter(filterCriteria);
  }

  clearDateFilter(): void {
    this.fromDateCtrl.setValue(null);
    this.toDateCtrl.setValue(null);
  }

  exportTransactions(): void {
    // const header = ['Txn ID', 'Item ID', 'Item Name', 'Type', 'Quantity', 'Date/Time'];
    // const rows = this.filteredTransactions.map(t => [t.txnId, t.itemId, t.itemName, t.type, t.quantity, t.dateTime]);
    // const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    // const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    // const url = URL.createObjectURL(blob);
    // const a = document.createElement('a');
    // a.href = url;
    // a.download = 'transactions.csv';
    // a.click();
    // URL.revokeObjectURL(url);
  }


  logout(): void {
    if (this.authService.isAuthenticated()) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }


private buildFilter(): FilterCriteria {

    const start = this.selectedStartDate();
    const end = this.selectedEndDate();
    const exType = this.selectedExpenseType() ;

    const filterCreteria: FilterCriteria = {

      expenseType: this.mapExpenseFilterToExpenseEnum( exType ) , 
      category: this.selectedCategory() ?? undefined,
      startDate: start ? this.dateUtilService.formatLocalDate(start) : undefined,
      endDate: end ? this.dateUtilService.formatLocalDate(end) : undefined,
      //minAmount: 20,
      //maxAmount: 500,
      //sortBy: 'date',
      //sortOrder: 'asc'
    }

  return filterCreteria;
}

private mapExpenseFilterToExpenseEnum(filter: ExpenseTypeFilter | undefined) : ExpenseTypeEnum | undefined {

  if (filter === ExpenseTypeFilter.EXPENSE) return ExpenseTypeEnum.EXPENSE;
  if (filter === ExpenseTypeFilter.INCOME) return ExpenseTypeEnum.INCOME;
  return undefined; // ALL or undefined

}

}