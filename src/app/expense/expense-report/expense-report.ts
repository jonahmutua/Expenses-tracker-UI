import { Component, OnInit } from '@angular/core';
import { MatNavList } from '@angular/material/list';
import { MatToolbar } from '@angular/material/toolbar';
import { MatIcon } from '@angular/material/icon';
import { MatSidenav, MatSidenavContainer, MatSidenavContent } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatProgressBar } from '@angular/material/progress-bar';

interface Stats {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  transactions: number;
}

interface Transaction {
  id: number;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  date: string;
  note: string;
}

interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
}

@Component({

  selector: 'et-report',
  templateUrl: './expense-report.component.html',
  styleUrls: ['./expense-report.component.css'],
  standalone: true,
  imports: [
    MatNavList,
    MatToolbar,
    MatIcon,
    MatSidenav,
    MatSidenavContainer,
    MatSidenavContent,
    MatButtonToggleModule,
    MatCardModule,
    MatListModule,
    DatePipe,
    DecimalPipe,
    MatProgressBar,
    MatButtonModule, 
  ],
})
export class ReportComponent implements OnInit {
  userName = 'John Doe';
  currentDate = new Date();
  selectedPeriod = 'month';

  stats: Stats = {
    totalIncome: 45000,
    totalExpenses: 32450,
    balance: 12550,
    transactions: 127
  };

  recentTransactions: Transaction[] = [
    { id: 1, type: 'expense', category: 'Groceries', amount: 2500, date: '2025-11-18', note: 'Weekly shopping' },
    { id: 2, type: 'income', category: 'Salary', amount: 45000, date: '2025-11-15', note: 'Monthly salary' },
    { id: 3, type: 'expense', category: 'Transport', amount: 1200, date: '2025-11-17', note: 'Fuel' },
    { id: 4, type: 'expense', category: 'Utilities', amount: 3500, date: '2025-11-16', note: 'Electricity bill' },
    { id: 5, type: 'expense', category: 'Entertainment', amount: 1800, date: '2025-11-14', note: 'Movie & dinner' }
  ];

  categoryBreakdown: CategoryData[] = [
    { category: 'Groceries', amount: 8500, percentage: 26 },
    { category: 'Transport', amount: 5200, percentage: 16 },
    { category: 'Utilities', amount: 6800, percentage: 21 },
    { category: 'Entertainment', amount: 4950, percentage: 15 },
    { category: 'Others', amount: 7000, percentage: 22 }
  ];

  ngOnInit(): void {
    // Load data here
  }

  onPeriodChange(): void {
    console.log('Period changed to:', this.selectedPeriod);
    // Reload data based on selected period
  }

  openAddDialog(): void {
    // Open add expense dialog
  }

  logout(): void {
    // Handle logout
  }

  authLabel(): string {
    return 'Logout';
  }
}