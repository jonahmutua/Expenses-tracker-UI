import { Expense } from "../models/expense/expense.model";

export class ExpenseData {

    static expenses: Expense[] = [{
        id: 1,
        expenseType: 1,
        date: '2025-10-20',
        amount: 10000,
        category: 'Salary',
        account: 'Bank',
        note: 'Payment from online services rendered'
    },

    {
        id: 2,
        expenseType: 2,
        date: '2025-10-26',
        amount: 200,
        category: 'Food',
        account: 'Cash',
        note: 'paid for lunch'
    },
    {
        id: 3,
        expenseType: 2,
        date: '2025-10-10',
        amount: 2000,
        category: 'Apparel',
        account: 'Cash',
        note: 'Bought two trousers'
    },
    {
        id: 4,
        expenseType: 2,
        date: '2025-10-22',
        amount: 3000,
        category: 'Farm',
        account: 'Cash',
        note: 'Payment for Farm tilling'
    }]


    static fetchExpenses(): Expense[] {
        return this.expenses;
    }
}