import { User, Wallet, Transaction, SavingsGoal, Category } from '../types';
import { DEFAULT_CATEGORIES } from '../constants';
import { supabase } from '../lib/supabaseClient';

export const supabaseService = {
  auth: {
    signIn: async (email: string, password?: string) => {
      if (!password) throw new Error("Password required");
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { user: null, error };
      return { user: data.user ? { id: data.user.id, email: data.user.email || '' } : null, error: null };
    },
    signUp: async (email: string, password?: string) => {
      if (!password) throw new Error("Password required");
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) return { user: null, error };
      return { user: data.user ? { id: data.user.id, email: data.user.email || '' } : null, error: null };
    },
    signOut: async () => {
      await supabase.auth.signOut();
    },
    getUser: async (): Promise<User | null> => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.user ? { id: session.user.id, email: session.user.email || '' } : null;
    }
  },

  db: {
    getWallets: async (): Promise<Wallet[]> => {
      const { data, error } = await supabase.from('wallets').select('*').order('created_at', { ascending: true });
      if (error) console.error(error);
      return data || [];
    },
    addWallet: async (wallet: Wallet) => {
      const { data, error } = await supabase.from('wallets').insert(wallet).select().single();
      if (error) console.error(error);
      return data;
    },
    
    getTransactions: async (): Promise<Transaction[]> => {
      const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false });
      if (error) console.error(error);
      return data || [];
    },
    addTransaction: async (tx: Transaction) => {
      // Wallet balance is updated via SQL Trigger 'on_transaction_created'
      const { data, error } = await supabase.from('transactions').insert(tx).select().single();
      if (error) console.error(error);
      return data;
    },

    getSavingsGoals: async (): Promise<SavingsGoal[]> => {
      const { data, error } = await supabase.from('savings_goals').select('*').order('created_at', { ascending: true });
      if (error) console.error(error);
      return data || [];
    },
    addSavingsGoal: async (goal: SavingsGoal) => {
      const { data, error } = await supabase.from('savings_goals').insert(goal).select().single();
      if (error) console.error(error);
      return data;
    },
    updateSavingsGoal: async (updatedGoal: SavingsGoal) => {
      const { data, error } = await supabase.from('savings_goals').update(updatedGoal).eq('id', updatedGoal.id).select().single();
      if (error) console.error(error);
      return data;
    },

    getCategories: async (): Promise<Category[]> => {
      // Keeping categories static for now, could be a DB table later
      return DEFAULT_CATEGORIES;
    }
  }
};