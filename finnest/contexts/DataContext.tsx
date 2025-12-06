
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Wallet, Transaction, SavingsGoal } from '../types';
import { dbService } from '../services/dbService';

interface DataContextType {
  wallets: Wallet[];
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  loading: boolean;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode, user: User | null }> = ({ children, user }) => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [w, t, s] = await Promise.all([
        dbService.db.getWallets(user.id),
        dbService.db.getTransactions(user.id),
        dbService.db.getSavingsGoals(user.id),
      ]);
      setWallets(w);
      setTransactions(t);
      setSavingsGoals(s);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();

    if (!user) return;

    // Neon DB doesn't support WebSocket subscriptions for frontend out of the box.
    // We will use polling to keep data fresh.
    const interval = setInterval(() => {
      fetchData();
    }, 15000); // Refresh every 15 seconds

    return () => clearInterval(interval);
  }, [user, fetchData]);

  return (
    <DataContext.Provider value={{ wallets, transactions, savingsGoals, loading, refreshData: fetchData }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
