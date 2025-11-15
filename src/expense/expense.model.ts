export interface Expense {
    
    id?: number;

    expenseType: number;

    date: string;

    amount: number;

    category: string;

    account: string;

    note: string;
   
    //private AppUser user;

}

/* Expense dialog data */
export interface ExpenseDialogData {
  mode: 'add' | 'edit';
  expense?: Expense; // optional for add mode
}

/* Epxense type Enum */
export enum ExpenseTypeEnum {
  Expense = 0,
  Income  = 1
}