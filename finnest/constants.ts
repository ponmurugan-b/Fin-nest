import { Category, TransactionType, WalletType } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'c1', name: 'Salary', type: TransactionType.INCOME, icon: 'briefcase' },
  { id: 'c2', name: 'Freelance', type: TransactionType.INCOME, icon: 'laptop' },
  { id: 'c3', name: 'Food & Dining', type: TransactionType.EXPENSE, icon: 'utensils' },
  { id: 'c4', name: 'Transportation', type: TransactionType.EXPENSE, icon: 'car' },
  { id: 'c5', name: 'Shopping', type: TransactionType.EXPENSE, icon: 'shopping-bag' },
  { id: 'c6', name: 'Bills & Utilities', type: TransactionType.EXPENSE, icon: 'zap' },
  { id: 'c7', name: 'Entertainment', type: TransactionType.EXPENSE, icon: 'film' },
  { id: 'c8', name: 'Health', type: TransactionType.EXPENSE, icon: 'heart' },
];

export const MOCK_INITIAL_DATA = {
  wallets: [
    { id: 'w1', user_id: 'u1', name: 'Main Bank', type: WalletType.BANK, balance: 25000, currency: 'INR' },
    { id: 'w2', user_id: 'u1', name: 'Cash', type: WalletType.CASH, balance: 1500, currency: 'INR' },
  ],
  transactions: [
    { id: 't1', user_id: 'u1', wallet_id: 'w1', amount: 50000, category_id: 'c1', type: TransactionType.INCOME, date: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(), notes: 'Monthly Salary' },
    { id: 't2', user_id: 'u1', wallet_id: 'w1', amount: 2000, category_id: 'c3', type: TransactionType.EXPENSE, date: new Date().toISOString(), notes: 'Dinner with friends' },
    { id: 't3', user_id: 'u1', wallet_id: 'w2', amount: 500, category_id: 'c4', type: TransactionType.EXPENSE, date: new Date().toISOString(), notes: 'Taxi' },
  ],
  savingsGoals: [
    { id: 'g1', user_id: 'u1', name: 'New Laptop', target_amount: 80000, current_amount: 25000, deadline: '2024-12-31' },
    { id: 'g2', user_id: 'u1', name: 'Emergency Fund', target_amount: 100000, current_amount: 40000 },
  ],
};