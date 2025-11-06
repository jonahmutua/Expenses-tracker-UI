import { Component, inject,  } from '@angular/core';
import { FormBuilder, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators, FormControl, } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule, } from '@angular/material/dialog';
import { Expense, ExpenseDialogData } from '../../models/expense/expense.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-expense-edit-dialog',
  standalone: true,
  templateUrl: './expense-edit-dialog.component.html',
  styleUrls: ['./expense-edit-dialog.component.css'],
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule
  ]
})
export class ExpenseEditDialogComponent {
  private dialogRef = inject(MatDialogRef<ExpenseEditDialogComponent>);
  private data = inject<ExpenseDialogData>(MAT_DIALOG_DATA);
  private fb = inject(NonNullableFormBuilder);
  
  mode = this.data.mode;

   expenseForm: FormGroup<{
    id: FormControl<number>;
    expenseType: FormControl<number>;
    category: FormControl<string>;
    date: FormControl<string>;
    amount: FormControl<number>;
    account: FormControl<string>;
  }>;

  constructor(){

    const exp = this.data.expense ?? {
      id: 0,
      expenseType: 0,
      category: '',
      date: '',
      amount: 0,
      account: ''
    }
     this.expenseForm = this.fb.group({
    id: this.fb.control(exp.id),
      expenseType: this.fb.control(exp.expenseType, [Validators.required, Validators.minLength(1)]),
      category: this.fb.control(exp.category, Validators.required),
      date: this.fb.control(exp.date, Validators.required),
      amount: this.fb.control(exp.amount, [Validators.required, Validators.min(1)]),
      account: this.fb.control(exp.account, this.mode === 'add' ? [Validators.required] : [])

  });
  }
 

  onSave() {

    if (this.expenseForm.valid) {
      if (!this.data?.expense) {
        // No original expense (e.g., adding a new one)
        console.log("New Expense")
        this.dialogRef.close(this.expenseForm.value as Expense);
        return;
      }
      const expense = this.expenseForm.value as Expense;

      // Compare with original data
      const original = this.data.expense;
      const hasChanges = (Object.keys(expense) as (keyof Expense)[]).some(key => expense[key] !== original[key]);

      // Only emit if changed otherwise just close without emitting 
      hasChanges ? this.dialogRef.close(expense) : this.dialogRef.close(); 
    } else {
      // Debugging - Log invalid controls and their errors 
      Object.keys(this.expenseForm.controls).forEach(key => {
        const control = this.expenseForm.get(key);
        if (control && control.invalid) {
          console.warn(`❌ Control "${key}" is invalid:`, control.errors);
        }
      });
      this.expenseForm.markAllAsTouched();
    }
    
  }

  onCancel() {
    if( this.expenseForm.dirty ){
      const confirmCancel =  window.confirm(
        "You have unsaved changes. Are you sure you want to cancel?"
      );

      if(!confirmCancel ){
        return; // User decided not to cancel
      }
    }
    this.dialogRef.close();
  }

  get f() {
    return this.expenseForm.controls;
  }
}
