import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
  FormControl,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { Expense, ExpenseDialogData, ExpenseTypeEnum } from '../expense.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatOption } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
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
    MatDialogModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatOption,
    MatSelectModule
  ],
})
export class ExpenseEditDialogComponent {

  private dialogRef = inject(MatDialogRef<ExpenseEditDialogComponent>);

  private data = inject<ExpenseDialogData>(MAT_DIALOG_DATA);

  private fb = inject(NonNullableFormBuilder);

  mode = this.data.mode;

  expenseTypeEnum = ExpenseTypeEnum; // Make expense type enum available 

  expenseTypes =  [
    {value: ExpenseTypeEnum.Expense, label: 'Expense'},
    {value: ExpenseTypeEnum.Income, label: 'Income'}
  ]

  expenseForm: FormGroup<{
    id: FormControl<number | undefined>;
    expenseType: FormControl<number>;
    category: FormControl<string>;
    date: FormControl<Date | null>;
    amount: FormControl<number | null>;
    account: FormControl<string>;
    note: FormControl<string>;
  }>;

  constructor() {
    const exp = this.data.expense ?? {
      id: undefined, // optional
      expenseType: 0,
      category: '',
      date: '',
      amount: null,
      account: '',
      note: '',
    };
    this.expenseForm = this.fb.group({
      id: this.fb.control<number | undefined>(exp.id), // optional
      expenseType: this.fb.control(exp.expenseType, [Validators.required]),
      category: this.fb.control(exp.category, Validators.required),
      date: this.fb.control(exp.date ? new Date(exp.date as string) : null, [Validators.required]),
      amount: this.fb.control(exp.amount, [Validators.required, Validators.min(0.01)]),
      account: this.fb.control(exp.account, this.mode === 'add' ? [Validators.required] : []),
      note: this.fb.control(exp.note, []),
    });
  }

  onSave() {
    if (this.expenseForm.valid) {
      const raw = this.expenseForm.value;

      // === Convert date input filed to 'YYYY-MM-dd' === //
      const expense: Expense = {
        id: raw.id!, // ok if optional
        expenseType: raw.expenseType!,
        category: raw.category!,
        date: raw.date ? new Date(raw.date).toISOString().split('T')[0] : '',
        amount: raw.amount!,
        account: raw.account!,
        note: raw.note ?? '',
      };

      // === Creating a new expense === //
      if (this.data?.mode === 'add') {
        this.dialogRef.close(expense);
        return;
      }

      // Compare with original data
      const original = this.data.expense;
      if (original) {
        const hasChanges = (Object.keys(expense) as (keyof Expense)[]).some(
          (key) => expense[key] !== original[key]
        );
        // Only emit if changed otherwise just close without emitting
        hasChanges ? this.dialogRef.close(expense) : this.dialogRef.close();
      }
    
    } else {
      this.expenseForm.markAllAsTouched();
    }
  }

  onCancel() {
    if (this.expenseForm.dirty) {
      const confirmCancel = window.confirm(
        'You have unsaved changes. Are you sure you want to cancel?'
      );

      if (!confirmCancel) {
        return; // User decided not to cancel
      }
    }
    this.dialogRef.close();
  }

  get f() {
    return this.expenseForm.controls;
  }
}
