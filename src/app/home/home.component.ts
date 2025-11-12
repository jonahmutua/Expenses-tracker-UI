import { Component, computed, effect, inject, Injector, runInInjectionContext, Signal, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbar } from '@angular/material/toolbar';
import { Expense } from '../../models/expense/expense.model';
import { SnackbarService } from '../../utils/snackbar.service';
import { ExpenseService } from '../../expense/expense.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ExpenseEditDialogComponent } from '../../expense/expense-edit-dialog/expense-edit-dialog.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { AuthService } from '../../auth/auth.service';

interface Transaction {
  txnId: string;
  itemId: string;
  itemName: string;
  type: 'IN' | 'OUT';
  quantity: number;
  dateTime: string;
}

@Component({
  selector: 'et-home',
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
    MatToolbar,
    MatDialogModule
  
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class HomeComponent {

  expenseService = inject( ExpenseService);

  authService = inject(AuthService);

  snackbarService = inject(SnackbarService);

  expenses: Signal<Expense[]> = this.expenseService.expenses;

  filteredExpenses: Signal<Expense[]> =  computed(()=>this.expenses());

  userName = "jkithaka";

  currentDate = Date.now();

  displayedColumns: string[] = ['type', 'category', 'amount','lastUpdatedAt', 'note','actions'];

  filterForm: FormGroup;

 

  transactions: Transaction[] = [
    { txnId: 'TXN5014', itemId: 'STK20250014', itemName: 'Floor Cleaner 1L', type: 'OUT', quantity: 8, dateTime: '2025-11-01T16:15:00' },
    { txnId: 'TXN0028', itemId: 'STK20250004', itemName: 'Ball Pen', type: 'IN', quantity: 30, dateTime: '2025-11-01T14:06:05' },
    { txnId: 'TXN5012', itemId: 'STK20250012', itemName: 'Notebook Bag', type: 'OUT', quantity: 15, dateTime: '2025-11-01T13:20:00' },
  ];

  filteredTransactions: Transaction[] = [...this.transactions];
 

  constructor(private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      type: ['ALL'],
      itemId: [''],
      fromDate: [''],
      toDate: ['']
    });
  }

  private dialog = inject( MatDialog );  // Dialog Box for Expense Editing 
    private injector = inject(Injector);

    editedExpense = signal<Expense | null > (null);// signal to hold the alst edited expense


    openEditDialog(expense: Expense): void {

        const dialogRef = this.dialog.open(ExpenseEditDialogComponent, {
         width: '400px',
         data: {mode: 'edit', expense: { ...expense }}, 
        });

        this.handleDialogResult( dialogRef.afterClosed() ); // handle dialog closed reactively  
    }

    openAddDialog() {
        const dialogRef =this.dialog.open(ExpenseEditDialogComponent, {
            width: '400px',
            data: { mode: 'add' },
        });
        this.handleDialogResult( dialogRef.afterClosed() );
    }   

    private handleDialogResult(dialogClosed$: Observable<Expense | null> ){
            runInInjectionContext(this.injector, ()=> {
            // convert afterClosed$ observable to signal 
            const closedSignal =  toSignal<Expense | null >( dialogClosed$, { initialValue: null});

            // reactively update our local signal when dialog closes 
            effect( () =>{
                const result = closedSignal();
                if( result){
                   this.editedExpense.set( result );
                   this.expenseService.upsertExpense( result );
                   console.log("Editing expense: " , JSON.stringify( result ));   
                }
            });
        });
    }

    deleteExpense(expense: Expense): void {
        this.expenseService.deleteExpense( expense);
        
    }

  applyFilter() {
    const { type, itemId, fromDate, toDate } = this.filterForm.value;
    this.filteredTransactions = this.transactions.filter(t => {
      const matchType = type === 'ALL' || t.type === type;
      const matchItem =
        !itemId ||
        t.itemId.toLowerCase().includes(itemId.toLowerCase()) ||
        t.itemName.toLowerCase().includes(itemId.toLowerCase());
      const date = new Date(t.dateTime);
      const from = fromDate ? new Date(fromDate) : null;
      const to = toDate ? new Date(toDate) : null;
      const matchDate = (!from || date >= from) && (!to || date <= to);
      return matchType && matchItem && matchDate;
    });
  }

  clearFilter() {
    this.filterForm.reset({ type: 'ALL', itemId: '', fromDate: '', toDate: '' });
    this.filteredTransactions = [...this.transactions];
  }

  exportTransactions() {
    const header = ['Txn ID', 'Item ID', 'Item Name', 'Type', 'Quantity', 'Date/Time'];
    const rows = this.filteredTransactions.map(t => [t.txnId, t.itemId, t.itemName, t.type, t.quantity, t.dateTime]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}
