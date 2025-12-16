import { FormControl } from "@angular/forms";
import { ApiResponseDto } from "../dto/api.responsedto";

export interface Expense {
    
    id?: number;

    expenseType: ExpenseTypeEnum;

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
  EXPENSE = 'EXPENSE',
  INCOME  = 'INCOME'
}


export enum ExpenseTypeFilter {
  ALL     = 'All',
  EXPENSE = 'EXPENSE',
  INCOME  = 'INCOME'
}

/* Expense Categories */
export enum ExpenseCategory {
  FOOD = 'Food',
  TRANSPORT = 'Transport',
  HOUSING = 'Housing',
  UTILITIES = 'Utilities',
  HEALTH = 'Health',
  ENTERTAINMENT = 'Entertainment',
  EDUCATION = 'Education',
  SHOPPING = 'Shopping',
  GROCERIES = 'Groceries',
  INSURANCE = 'Insurance',
  SAVINGS = 'Savings',
  LOAN_PAYMENTS = 'Loan Payments',
  CHARITY = 'Charity',
  OTHER = 'Other'
}


/* Income Category */
export enum IncomeCategory {
  SALARY = 'Salary',
  BONUS = 'Bonus',
  BUSINESS = 'Business',
  INTEREST = 'Interest',
  GIFTS = 'Gifts',
  OTHER = 'Other'
}


/* Forms */
/* Exepnses Filter Form */
export interface ExpenseFilterForm {
  type: FormControl<ExpenseTypeFilter>;
  category : FormControl<ExpenseCategory | IncomeCategory | ''>;
  fromDate: FormControl<Date| null>; 
  toDate: FormControl<Date | null>;
}

/* Exepnse Form - Creating New Expense / Editing Existing */
export interface ExpenseForm {
  id:         FormControl<number | null> ;
  type:       FormControl<ExpenseTypeEnum> ;
  category:   FormControl<IncomeCategory | ExpenseCategory | ''>;
  date:       FormControl<Date | null> ;
  account:    FormControl<string | null>;
  amount:     FormControl<number>;
  note:       FormControl<string | null>;
}

export interface FilterCriteria {
  expenseType?: ExpenseTypeEnum;
  searchTerm?: string;
  month?: string;
  category?: string;
  minAmount?: number;
  maxAmount?: number;
  startDate?: string;
  endDate?: string;
  dateRange?: { start: Date; end: Date; };
  sortBy?: 'date' | 'amount' | 'description';
  sortOrder?: 'asc' | 'desc';
}


export interface ExpenseState {
  isLoading: boolean;
  error: string | null;
  // operationProgress: boolean;
  // operationError: string | null;
  filter: FilterCriteria;
  //pagination: {page: number, pageSize: number};
  expenses: Expense[];
  backendFiltered: Expense[];
}

export type ExpenseAction = 
  | { type: 'load' }
  | { type: 'filter'; criteria: FilterCriteria }
  | { type: 'upsert'; expense: Expense }
  | { type: 'delete'; id: number}


export type ExpenseActionResult = 
  | ApiResponseDto<Expense[]>
  | ApiResponseDto<Expense>
  | ApiResponseDto<void> ;