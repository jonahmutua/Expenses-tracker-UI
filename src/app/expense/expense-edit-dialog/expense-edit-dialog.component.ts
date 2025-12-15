import { Component, computed, effect, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
  FormControl,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { Expense, ExpenseCategory, ExpenseDialogData, ExpenseForm, ExpenseTypeEnum, IncomeCategory,} from '../expense.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatOption } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { toSignal } from '@angular/core/rxjs-interop';
import { DateUtilService } from '../../shared/utils/date-util.service';
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

  private dialogData = inject<ExpenseDialogData>(MAT_DIALOG_DATA);

  private fb = inject(FormBuilder);

  private dateService = inject(DateUtilService);

  mode = this.dialogData.mode;

  
    expenseForm: FormGroup<ExpenseForm> = this.fb.group({
    id:       [null],
    type:     [ExpenseTypeEnum.EXPENSE, [Validators.required]],
    category: ['', [Validators.required]],
    date:     [null, [Validators.required]],
    account:  [null, [Validators.required]],
    amount:   [0, [Validators.required, Validators.min(0.01)]],
    note:     [null]
    }) as FormGroup<ExpenseForm>;
    
    //Form Control accessors 
    idCtrl       = this.expenseForm.get('id') as FormControl<number | null>;
    typeCtrl     = this.expenseForm.get('type') as FormControl<ExpenseTypeEnum>;
    categoryCtrl = this.expenseForm.get('category') as FormControl<IncomeCategory | ExpenseCategory | ''>;
    accountCtrl  = this.expenseForm.get('account') as FormControl<string | null>;
    dateCtrl     = this.expenseForm.get('date') as FormControl<Date | null>;
    amountCtrl   = this.expenseForm.get('amount') as FormControl<number>;
    noteCtrl     = this.expenseForm.get('note')  as FormControl<string | null>;
    
    //Form values as signals 
    formValues = toSignal(this.expenseForm.valueChanges, 
    {initialValue: this.expenseForm.getRawValue()});
    
    selectedExpenseType = computed( () => this.formValues().type );

    // UI
    // expense type options 
    expenseTypeOptions = signal(Object.values( ExpenseTypeEnum));

   // Category options based on exepnse type
    categoryOptions = computed( () => {
  
      if( this.selectedExpenseType() === ExpenseTypeEnum.EXPENSE) return Object.values(ExpenseCategory);
      if( this.selectedExpenseType() === ExpenseTypeEnum.INCOME) return Object.values(IncomeCategory);
      return [];
    
    });
    
    constructor() {
      // load expense data if user opens dialog in edit mode
      if( this.dialogData.mode === 'edit' && this.dialogData.expense ){
          this.loadExpense(this.dialogData.expense);
      }
      
      // Auto-reset category when user changes expense type 
      effect(()=>{
       this.selectedExpenseType();
       // Only reset if user changed type, not during initial load.
       if( this.categoryCtrl.dirty ){
          this.categoryCtrl.setValue('');
       } 

      });
      
    }
    
    // load expense for editing 
    private loadExpense(expense: Expense) : void {
       this.expenseForm.patchValue ({
         id: expense.id,
         type: expense.expenseType,
         category: this.toCategoryEnum( expense.category) ,
         account: expense.account,
         date: new Date(expense.date),
         amount: expense.amount,
         note: expense.note
       });
    }
    
     // Submits Form 
      onSave(): void {
       const formValue = this.expenseForm.getRawValue();
    
       const expenseData: Expense = {
           id: formValue.id ?? null,
           expenseType: formValue.type,
           category: formValue.category,
           date: formValue.date? this.dateService.formatLocalDate(formValue.date) : this.dateService.formatLocalDate(new Date()),
           account: formValue.account,
           amount: formValue.amount,
           note: formValue.note ?? ''
         } as Expense;
    
       this.dialogRef.close( expenseData)
    
   }

    // Excutes If user has Cancelled  the Dialog
  onCancel() {
    if (this.expenseForm.dirty) {
      // Display a confirm prompt
      const confirmCancel = window.confirm(
        'You have unsaved changes. Are you sure you want to cancel?'
      );

      if (!confirmCancel) {
        return; // User decided not to cancel
      }
    }
    // user decided to proceed with cancellation anyway
    this.dialogRef.close();
  }
   
   // ========== Helper Methods  ================ //

   // Maps category string type to CategoryEnum type - 
   private toCategoryEnum(value: string) : IncomeCategory | ExpenseCategory | '' {
    if( Object.values(IncomeCategory).includes( value as any)) return value as IncomeCategory;

    if( Object.values(ExpenseCategory).includes( value as any)) return value as ExpenseCategory;

    return '' ; //fallback - empty string
   }



}
