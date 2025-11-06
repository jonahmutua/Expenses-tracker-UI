import { Injectable, signal } from "@angular/core";
import { Expense } from "../models/expense/expense.model";
import { ExpenseData } from "./expense.data";

@Injectable(
    {
        providedIn: 'root'
    }
)
export class ExpenseService {

    //expenses: Expense[] = [];
    expenses = signal<Expense[]>([]);

    constructor(){
        this.loadExpenses();
    }

    // TODO: Call HTPPClient
    loadExpenses(): void {
        const data = ExpenseData.fetchExpenses(); // in memory mock data
        this.expenses.set( data );
    }
   
    
  // Add or update an expense
  upsertExpense(expense: Expense) {

   this.expenses.update(current => {
    const index = current.findIndex(e => e.id === expense.id);

    if (index >= 0) {
      // Update existing
      return [
        ...current.slice(0, index),
        expense,
        ...current.slice(index + 1),
      ];
      // Optionally, call your backend API to persist the change
      // this.http.put(`/api/expenses/${expense.id}`, expense).subscribe();
    } else {
      // Add new
      const newExpense = { ...expense, id: Math.max(0, ...current.map(e => e.id ?? 0)) + 1 };
      return [...current, newExpense];

      // Optionally, call your backend API to persist new Expense
      // this.http.(`/api/expenses/$`, expense).subscribe();
    }
  });


  }

  // Delete an expense
  deleteExpense(expense: Expense) {
    this.expenses.update(current => current.filter(e => e.id !== expense.id));
  }
}