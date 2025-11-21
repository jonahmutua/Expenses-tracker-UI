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
import { Expense, ExpenseCategory, ExpenseFilterForm, ExpenseTypeFilter, IncomeCategory } from '../expense.model';
import { SnackbarService } from '../../utils/snackbar.service';
import { ExpenseService } from '../../expense/expense.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ExpenseEditDialogComponent } from '../../expense/expense-edit-dialog/expense-edit-dialog.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { RouterModule, Router } from '@angular/router';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';

interface Transaction {
  txnId: string;
  itemId: string;
  itemName: string;
  type: 'IN' | 'OUT';
  quantity: number;
  dateTime: string;
}

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
  dateRange = computed( () => ({
    from: this.filterValues().fromDate,
    to:   this.filterValues().toDate,
  }));

  // Category Options ( Dynamic based on expense Type )
  categoryOptions = computed( ()=> {
      switch (this.selectedExpenseType()) {
      case ExpenseTypeFilter.EXPENSE:
        return Object.values(ExpenseCategory);
      case ExpenseTypeFilter.INCOME:
        return Object.values(IncomeCategory);
      default:
        return [];
    }
  })

  
  editedExpense = signal<Expense | null>(null);

  filteredExpenses = computed(() => {
    const allExpenses = this.expenseService.expenses();
    const selectedType = this.selectedExpenseType() ?? ExpenseTypeFilter.ALL;
    const category =  this.selectedCategory() ?? '';
    const { from, to } = this.dateRange();

    return allExpenses.filter( expense => 
      this.typeMatches( expense, selectedType) &&
      this.categoryMatches(expense, category)  &&
      this.dateMatches(expense, from ?? null, to ?? null) 

    );

  });


  // UI data
  displayedColumns: string[] = ['type', 'category', 'amount', 'lastUpdatedAt', 'note', 'actions'];

  expenseTypeOptions = signal<ExpenseTypeFilter[]>(Object.values(ExpenseTypeFilter));
 

  // Transaction data (should this be moved to a service?)
  transactions: Transaction[] = [
    { txnId: 'TXN5014', itemId: 'STK20250014', itemName: 'Floor Cleaner 1L', type: 'OUT', quantity: 8, dateTime: '2025-11-01T16:15:00' },
    { txnId: 'TXN0028', itemId: 'STK20250004', itemName: 'Ball Pen', type: 'IN', quantity: 30, dateTime: '2025-11-01T14:06:05' },
    { txnId: 'TXN5012', itemId: 'STK20250012', itemName: 'Notebook Bag', type: 'OUT', quantity: 15, dateTime: '2025-11-01T13:20:00' },
  ];

  filteredTransactions: Transaction[] = [...this.transactions];

  constructor() {
    // Load expenses on component init
    // The AuthGuard ensures we're authenticated before getting here
    this.expenseService.loadExpenses();


    // Watch when expense Type Option changes and sync with form 
    effect( () => {
      this.selectedExpenseType();

      // Reset category when switching type 
      this.filterForm.get('category')?.setValue('');
    });

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
    this.expenseService.deleteExpense(expense);
  }

  // === Filter Management ===

  applyFilter(): void {
    // const { type, itemId, fromDate, toDate } = this.filterForm.value;
    // this.filteredTransactions = this.transactions.filter(t => {
    //   const matchType = type === 'ALL' || t.type === type;
    //   const matchItem =
    //     !itemId ||
    //     t.itemId.toLowerCase().includes(itemId.toLowerCase()) ||
    //     t.itemName.toLowerCase().includes(itemId.toLowerCase());
    //   const date = new Date(t.dateTime);
    //   const from = fromDate ? new Date(fromDate) : null;
    //   const to = toDate ? new Date(toDate) : null;
    //   const matchDate = (!from || date >= from) && (!to || date <= to);
    //   return matchType && matchItem && matchDate;
    // });

    
  }

  clearDateFilter(): void {
    this.fromDateCtrl.setValue(null);
    this.toDateCtrl.setValue(null);
  //   this.filterForm.reset({ type: 'ALL', itemId: '', fromDate: '', toDate: '' });
  //   this.filteredTransactions = [...this.transactions];
  }

  // === Export ===

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

  // === Logout (if you have a logout button in the template) ===

  logout(): void {
    if (this.authService.isAuthenticated()) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }

// Mapping numeric values to ExpenseTypeFilter enum
private numericTypeMap : Record<number, ExpenseTypeFilter> = {
  999: ExpenseTypeFilter.ALL,
  0: ExpenseTypeFilter.EXPENSE,
  1: ExpenseTypeFilter.INCOME
};

  private typeMatches(expense: Expense, selectedType: ExpenseTypeFilter) : boolean {
    const mappedType = this.numericTypeMap[expense.expenseType];
    return selectedType === ExpenseTypeFilter.ALL || mappedType === selectedType  as string ;
  }

  private categoryMatches(exepnse: Expense, selectedCategory: ExpenseCategory | IncomeCategory | '') : boolean {
    return selectedCategory === '' || exepnse.category === selectedCategory as string;
  }

  // Compares Dates only and ignores Time
  private dateMatches(expense: Expense, from: Date | null, to: Date | null): boolean {
    if (!from && !to) return true;
    
    const expDate = new Date(expense.date);
    const expDateOnly = this.getDateOnly(expDate);
    const fromDateOnly = from ? this.getDateOnly(from) : null;
    const toDateOnly = to ? this.getDateOnly(to) : null;

    // Compare as strings (DD-MM-YYYY format)
    const fromMatch = !fromDateOnly || expDateOnly >= fromDateOnly;
    const toMatch = !toDateOnly || expDateOnly <= toDateOnly;

    return fromMatch && toMatch;
  }

  private getDateDaysAgo(days: number) : Date {
    const date = new Date();
    date.setDate( date.getDate() - days);
    return date;
  }

  // Converts Date object to dd-mm-yyyy format
  private getDateOnly(date: Date): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

}