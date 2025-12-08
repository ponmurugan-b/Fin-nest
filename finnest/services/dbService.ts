import { User, Wallet, Transaction, SavingsGoal, Category } from '../types';
import { DEFAULT_CATEGORIES } from '../constants';
import { supabase } from '../lib/dbClient';

// Password hashing using Web Crypto API
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
};

export const dbService = {
  auth: {
    signIn: async (email: string, password?: string) => {
      if (!password) throw new Error("Password required");
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, email, name, phone, profile_pic, email_verified, password_hash')
          .eq('email', email)
          .single();

        if (error || !data) {
          return { user: null, error: { message: "Invalid email or password" } };
        }
        
        const isValid = await verifyPassword(password, data.password_hash);
        
        if (!isValid) {
          return { user: null, error: { message: "Invalid email or password" } };
        }
        
        // Return user without password_hash
        const { password_hash, ...safeUser } = data;
        return { user: safeUser as User, error: null };
      } catch (err: any) {
        return { user: null, error: err };
      }
    },
    
    signUp: async (email: string, password?: string, name?: string) => {
      if (!password) throw new Error("Password required");
      try {
        const id = crypto.randomUUID();
        const passwordHash = await hashPassword(password);
        
        const { data, error } = await supabase
          .from('users')
          .insert({
            id,
            email,
            password_hash: passwordHash,
            name: name || null,
            email_verified: true
          })
          .select('id, email, name, phone, profile_pic, email_verified')
          .single();
        
        if (error) {
          if (error.code === '23505') {
            return { user: null, error: { message: "An account with this email already exists" } };
          }
          return { user: null, error: { message: error.message } };
        }
        
        return { user: data as User, error: null };
      } catch (err: any) {
        return { user: null, error: err };
      }
    },
    
    signOut: async () => {
      return;
    },
    
    updateProfile: async (userId: string, updates: { name?: string; phone?: string; profile_pic?: string }) => {
      try {
        const updateData: any = {};
        if (updates.name !== undefined) updateData.name = updates.name;
        if (updates.phone !== undefined) updateData.phone = updates.phone;
        if (updates.profile_pic !== undefined) updateData.profile_pic = updates.profile_pic;
        
        if (Object.keys(updateData).length === 0) {
          return { success: false, error: { message: "No updates provided" } };
        }
        
        const { data, error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', userId)
          .select('id, email, name, phone, profile_pic, email_verified')
          .single();
        
        if (error || !data) {
          return { success: false, error: { message: error?.message || "User not found" } };
        }
        
        return { success: true, user: data as User, error: null };
      } catch (err: any) {
        return { success: false, error: err };
      }
    },
    
    changePassword: async (userId: string, currentPassword: string, newPassword: string) => {
      try {
        const { data: userData, error: fetchError } = await supabase
          .from('users')
          .select('password_hash')
          .eq('id', userId)
          .single();
        
        if (fetchError || !userData) {
          return { success: false, error: { message: "User not found" } };
        }
        
        const isValid = await verifyPassword(currentPassword, userData.password_hash);
        
        if (!isValid) {
          return { success: false, error: { message: "Current password is incorrect" } };
        }
        
        const newPasswordHash = await hashPassword(newPassword);
        
        const { error: updateError } = await supabase
          .from('users')
          .update({ password_hash: newPasswordHash })
          .eq('id', userId);
        
        if (updateError) {
          return { success: false, error: { message: updateError.message } };
        }
        
        return { success: true, error: null };
      } catch (err: any) {
        return { success: false, error: err };
      }
    },
    
    getUser: async (userId: string): Promise<User | null> => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, email, name, phone, profile_pic, email_verified')
          .eq('id', userId)
          .single();
        
        if (error || !data) return null;
        return data as User;
      } catch (e) {
        console.error(e);
        return null;
      }
    }
  },

  db: {
    getWallets: async (userId: string): Promise<Wallet[]> => {
      try {
        const { data, error } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true });
        
        if (error || !data) return [];
        return data.map(row => ({ ...row, balance: parseFloat(row.balance) || 0 }));
      } catch (e) {
        console.error(e);
        return [];
      }
    },
    
    addWallet: async (wallet: Wallet) => {
      try {
        const { data, error } = await supabase
          .from('wallets')
          .insert({
            id: wallet.id,
            user_id: wallet.user_id,
            name: wallet.name,
            type: wallet.type,
            balance: wallet.balance,
            currency: wallet.currency
          })
          .select()
          .single();
        
        if (error) return null;
        return data;
      } catch (e) {
        console.error(e);
        return null;
      }
    },
    
    transferBetweenWallets: async (fromWalletId: string, toWalletId: string, amount: number, userId: string, notes?: string) => {
      try {
        // Get current balances
        const { data: fromWallet } = await supabase
          .from('wallets')
          .select('balance')
          .eq('id', fromWalletId)
          .single();
        
        const { data: toWallet } = await supabase
          .from('wallets')
          .select('balance')
          .eq('id', toWalletId)
          .single();
        
        if (!fromWallet || !toWallet) {
          return { success: false, error: { message: 'Wallet not found' } };
        }
        
        // Update source wallet
        await supabase
          .from('wallets')
          .update({ balance: parseFloat(fromWallet.balance) - amount })
          .eq('id', fromWalletId);
        
        // Update destination wallet
        await supabase
          .from('wallets')
          .update({ balance: parseFloat(toWallet.balance) + amount })
          .eq('id', toWalletId);
        
        // Create transfer-out transaction
        await supabase
          .from('transactions')
          .insert({
            id: crypto.randomUUID(),
            user_id: userId,
            wallet_id: fromWalletId,
            amount,
            category_id: 'transfer',
            type: 'expense',
            date: new Date().toISOString(),
            notes: `Transfer out: ${notes || 'Wallet transfer'}`
          });
        
        // Create transfer-in transaction
        await supabase
          .from('transactions')
          .insert({
            id: crypto.randomUUID(),
            user_id: userId,
            wallet_id: toWalletId,
            amount,
            category_id: 'transfer',
            type: 'income',
            date: new Date().toISOString(),
            notes: `Transfer in: ${notes || 'Wallet transfer'}`
          });
        
        return { success: true };
      } catch (e) {
        console.error(e);
        return { success: false, error: e };
      }
    },
    
    getTransactions: async (userId: string): Promise<Transaction[]> => {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: false });
        
        if (error || !data) return [];
        return data.map(row => ({ ...row, amount: parseFloat(row.amount) || 0 }));
      } catch (e) {
        console.error(e);
        return [];
      }
    },
    
    addTransaction: async (tx: Transaction) => {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .insert({
            id: tx.id,
            user_id: tx.user_id,
            wallet_id: tx.wallet_id,
            amount: tx.amount,
            category_id: tx.category_id,
            type: tx.type,
            date: tx.date,
            notes: tx.notes
          })
          .select()
          .single();
        
        if (error) return null;
        return data;
      } catch (e) {
        console.error(e);
        return null;
      }
    },

    getSavingsGoals: async (userId: string): Promise<SavingsGoal[]> => {
      try {
        const { data, error } = await supabase
          .from('savings_goals')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true });
        
        if (error || !data) return [];
        return data.map(row => ({
          ...row,
          target_amount: parseFloat(row.target_amount) || 0,
          current_amount: parseFloat(row.current_amount) || 0
        }));
      } catch (e) {
        console.error(e);
        return [];
      }
    },
    
    addSavingsGoal: async (goal: SavingsGoal) => {
      try {
        const { data, error } = await supabase
          .from('savings_goals')
          .insert({
            id: goal.id,
            user_id: goal.user_id,
            name: goal.name,
            target_amount: goal.target_amount,
            current_amount: goal.current_amount,
            deadline: goal.deadline
          })
          .select()
          .single();
        
        if (error) return null;
        return data;
      } catch (e) {
        console.error(e);
        return null;
      }
    },
    
    updateSavingsGoal: async (updatedGoal: SavingsGoal) => {
      try {
        const { data, error } = await supabase
          .from('savings_goals')
          .update({ current_amount: updatedGoal.current_amount })
          .eq('id', updatedGoal.id)
          .select()
          .single();
        
        if (error) return null;
        return data;
      } catch (e) {
        console.error(e);
        return null;
      }
    },

    getCategories: async (): Promise<Category[]> => {
      return DEFAULT_CATEGORIES;
    }
  }
};
