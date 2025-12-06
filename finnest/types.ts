export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export enum WalletType {
  BANK = 'bank',
  CASH = 'cash',
  UPI = 'upi',
}

export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  profile_pic?: string;
  email_verified: boolean;
}

export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  type: WalletType;
  balance: number;
  currency: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  wallet_id: string;
  amount: number;
  category_id: string;
  type: TransactionType;
  date: string;
  notes?: string;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  notes?: string;
}

export interface AppState {
  user: User | null;
  wallets: Wallet[];
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  categories: Category[];
}