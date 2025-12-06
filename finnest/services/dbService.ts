import { User, Wallet, Transaction, SavingsGoal, Category } from '../types';
import { DEFAULT_CATEGORIES } from '../constants';
import { pool } from '../lib/dbClient';
import { hashPassword, verifyPassword } from './emailService';

export const dbService = {
  auth: {
    signIn: async (email: string, password?: string) => {
      if (!password) throw new Error("Password required");
      try {
        const result = await pool.query(
          'SELECT id, email, name, phone, profile_pic, email_verified, password_hash FROM users WHERE email = $1',
          [email]
        );
        if (result.rows.length === 0) {
          return { user: null, error: { message: "Invalid email or password" } };
        }
        
        const user = result.rows[0];
        const isValid = await verifyPassword(password, user.password_hash);
        
        if (!isValid) {
          return { user: null, error: { message: "Invalid email or password" } };
        }
        
        // Return user without password_hash
        const { password_hash, ...safeUser } = user;
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
        
        const result = await pool.query(
          `INSERT INTO users (id, email, password_hash, name, email_verified) 
           VALUES ($1, $2, $3, $4, $5) 
           RETURNING id, email, name, phone, profile_pic, email_verified`,
          [id, email, passwordHash, name || null, true]
        );
        
        const user = result.rows[0];
        return { 
          user: { 
            id: user.id, 
            email: user.email, 
            name: user.name,
            email_verified: user.email_verified 
          } as User, 
          error: null 
        };
      } catch (err: any) {
        if (err.code === '23505') { // Unique violation
          return { user: null, error: { message: "An account with this email already exists" } };
        }
        return { user: null, error: err };
      }
    },
    
    signOut: async () => {
      return;
    },
    
    // Profile management
    updateProfile: async (userId: string, updates: { name?: string; phone?: string; profile_pic?: string }) => {
      try {
        const fields: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;
        
        if (updates.name !== undefined) {
          fields.push(`name = $${paramIndex++}`);
          values.push(updates.name);
        }
        if (updates.phone !== undefined) {
          fields.push(`phone = $${paramIndex++}`);
          values.push(updates.phone);
        }
        if (updates.profile_pic !== undefined) {
          fields.push(`profile_pic = $${paramIndex++}`);
          values.push(updates.profile_pic);
        }
        
        if (fields.length === 0) {
          return { success: false, error: { message: "No updates provided" } };
        }
        
        values.push(userId);
        
        const result = await pool.query(
          `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} 
           RETURNING id, email, name, phone, profile_pic, email_verified`,
          values
        );
        
        if (result.rows.length === 0) {
          return { success: false, error: { message: "User not found" } };
        }
        
        return { success: true, user: result.rows[0] as User, error: null };
      } catch (err: any) {
        return { success: false, error: err };
      }
    },
    
    changePassword: async (userId: string, currentPassword: string, newPassword: string) => {
      try {
        // First verify current password
        const userResult = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
        
        if (userResult.rows.length === 0) {
          return { success: false, error: { message: "User not found" } };
        }
        
        const isValid = await verifyPassword(currentPassword, userResult.rows[0].password_hash);
        
        if (!isValid) {
          return { success: false, error: { message: "Current password is incorrect" } };
        }
        
        // Update to new password
        const newPasswordHash = await hashPassword(newPassword);
        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newPasswordHash, userId]);
        
        return { success: true, error: null };
      } catch (err: any) {
        return { success: false, error: err };
      }
    },
    
    getUser: async (userId: string): Promise<User | null> => {
      try {
        const result = await pool.query(
          'SELECT id, email, name, phone, profile_pic, email_verified FROM users WHERE id = $1',
          [userId]
        );
        return result.rows[0] || null;
      } catch (e) {
        console.error(e);
        return null;
      }
    }
  },

  db: {
    getWallets: async (userId: string): Promise<Wallet[]> => {
      try {
        const { rows } = await pool.query('SELECT * FROM wallets WHERE user_id = $1 ORDER BY created_at ASC', [userId]);
        return rows.map(row => ({ ...row, balance: parseFloat(row.balance) || 0 }));
      } catch (e) {
        console.error(e);
        return [];
      }
    },
    addWallet: async (wallet: Wallet) => {
      try {
        const { rows } = await pool.query(
          `INSERT INTO wallets (id, user_id, name, type, balance, currency) 
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [wallet.id, wallet.user_id, wallet.name, wallet.type, wallet.balance, wallet.currency]
        );
        return rows[0];
      } catch (e) {
        console.error(e);
        return null;
      }
    },
    
    // Transfer between wallets
    transferBetweenWallets: async (fromWalletId: string, toWalletId: string, amount: number, userId: string, notes?: string) => {
      try {
        // Deduct from source wallet
        await pool.query(
          `UPDATE wallets SET balance = balance - $1 WHERE id = $2 AND user_id = $3`,
          [amount, fromWalletId, userId]
        );
        
        // Add to destination wallet
        await pool.query(
          `UPDATE wallets SET balance = balance + $1 WHERE id = $2 AND user_id = $3`,
          [amount, toWalletId, userId]
        );
        
        // Create transfer-out transaction
        const transferOutId = crypto.randomUUID();
        await pool.query(
          `INSERT INTO transactions (id, user_id, wallet_id, amount, category_id, type, date, notes) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [transferOutId, userId, fromWalletId, amount, 'transfer', 'expense', new Date().toISOString(), `Transfer out: ${notes || 'Wallet transfer'}`]
        );
        
        // Create transfer-in transaction
        const transferInId = crypto.randomUUID();
        await pool.query(
          `INSERT INTO transactions (id, user_id, wallet_id, amount, category_id, type, date, notes) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [transferInId, userId, toWalletId, amount, 'transfer', 'income', new Date().toISOString(), `Transfer in: ${notes || 'Wallet transfer'}`]
        );
        
        return { success: true };
      } catch (e) {
        console.error(e);
        return { success: false, error: e };
      }
    },
    
    getTransactions: async (userId: string): Promise<Transaction[]> => {
      try {
        const { rows } = await pool.query('SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC', [userId]);
        return rows.map(row => ({ ...row, amount: parseFloat(row.amount) || 0 }));
      } catch (e) {
        console.error(e);
        return [];
      }
    },
    addTransaction: async (tx: Transaction) => {
      try {
        const { rows } = await pool.query(
          `INSERT INTO transactions (id, user_id, wallet_id, amount, category_id, type, date, notes) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
          [tx.id, tx.user_id, tx.wallet_id, tx.amount, tx.category_id, tx.type, tx.date, tx.notes]
        );
        return rows[0];
      } catch (e) {
        console.error(e);
        return null;
      }
    },

    getSavingsGoals: async (userId: string): Promise<SavingsGoal[]> => {
      try {
        const { rows } = await pool.query('SELECT * FROM savings_goals WHERE user_id = $1 ORDER BY created_at ASC', [userId]);
        return rows.map(row => ({
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
        const { rows } = await pool.query(
          `INSERT INTO savings_goals (id, user_id, name, target_amount, current_amount, deadline) 
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [goal.id, goal.user_id, goal.name, goal.target_amount, goal.current_amount, goal.deadline]
        );
        return rows[0];
      } catch (e) {
        console.error(e);
        return null;
      }
    },
    updateSavingsGoal: async (updatedGoal: SavingsGoal) => {
      try {
        const { rows } = await pool.query(
          `UPDATE savings_goals SET current_amount = $1 WHERE id = $2 RETURNING *`,
          [updatedGoal.current_amount, updatedGoal.id]
        );
        return rows[0];
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
