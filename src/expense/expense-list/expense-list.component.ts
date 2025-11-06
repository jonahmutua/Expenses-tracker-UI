import { Component, effect, inject, Injector, OnInit, runInInjectionContext, Signal, signal } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import {MatTableModule} from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Expense } from '../../models/expense/expense.model';

import { ExpenseService } from '../expense.service';
import { ExpenseEditDialogComponent } from '../expense-edit-dialog/expense-edit-dialog.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { disableDebugTools } from '@angular/platform-browser';
import { Observable } from 'rxjs';

@Component(
    {
        selector: 'et-expense-list',
        templateUrl: './expense-list.component.html',
        styleUrls: ['./expense-list.component.css'],
        imports: [
            MatTableModule, MatButtonModule, MatIconModule, CommonModule,MatCardModule,MatDialogModule
        ]

    }
)
export class ExpenseListComponent  {
   

    expenseService = inject( ExpenseService);

    // Reactive expense list 
    expenses: Signal<Expense[]> = this.expenseService.expenses;

    displayedColumns: string[] = ['type', 'category', 'amount','lastUpdatedAt', 'actions'];

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
}