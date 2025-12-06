
import React, { useState, useEffect } from 'react';
import { User, TransactionType, Transaction } from '../types';
import { ArrowUpRight, ArrowDownRight, Wallet as WalletIcon, TrendingUp, Plus, ArrowUp, ArrowDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { useData } from '../contexts/DataContext';
import { dbService } from '../services/dbService';
import { DEFAULT_CATEGORIES } from '../constants';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const { wallets, transactions, savingsGoals, refreshData } = useData();
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form State
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[2].id);
  const [walletId, setWalletId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Set default wallet when wallets load
  useEffect(() => {
    if (wallets.length > 0 && !walletId) {
      setWalletId(wallets[0].id);
    }
  }, [wallets, walletId]);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !walletId) return;

    const newTx: Transaction = {
      id: crypto.randomUUID(),
      user_id: user.id,
      wallet_id: walletId,
      amount: parseFloat(amount),
      category_id: category,
      type: type,
      date: new Date(date).toISOString(),
      notes: notes
    };

    await dbService.db.addTransaction(newTx);
    
    // Reset form
    setAmount('');
    setNotes('');
    setShowAddModal(false);
    refreshData();
  };

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
  
  const currentMonthTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const income = currentMonthTransactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = currentMonthTransactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + t.amount, 0);

  // Data for Category Chart
  const expenseByCategory = currentMonthTransactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, t) => {
      acc[t.category_id] = (acc[t.category_id] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const chartData = Object.keys(expenseByCategory).map(key => ({
    name: key, // In real app, map ID to Category Name
    value: expenseByCategory[key]
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800">Welcome Back</h2>
        <p className="text-sm md:text-base text-slate-500">Here's your financial overview for this month.</p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-emerald-500 text-white rounded-2xl p-6 shadow-lg shadow-emerald-500/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-emerald-100">Net Balance</h3>
            <WalletIcon className="opacity-80" />
          </div>
          <p className="text-3xl font-bold">₹{totalBalance.toLocaleString()}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-1 gap-4 md:gap-0 md:contents">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
             <div className="flex items-center justify-between mb-2 md:mb-4">
              <h3 className="text-sm md:text-base font-medium text-slate-500">Income</h3>
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <ArrowUpRight size={16} md:size={20} />
              </div>
            </div>
            <p className="text-xl md:text-2xl font-bold text-slate-800">₹{income.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
             <div className="flex items-center justify-between mb-2 md:mb-4">
              <h3 className="text-sm md:text-base font-medium text-slate-500">Expense</h3>
              <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
                <ArrowDownRight size={16} md:size={20} />
              </div>
            </div>
            <p className="text-xl md:text-2xl font-bold text-slate-800">₹{expense.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Savings Goals & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart Area */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Spending Analysis</h3>
          {chartData.length > 0 ? (
             <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{fontSize: 12}} />
                  <YAxis tick={{fontSize: 12}} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
             </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400 text-center">
              No expense data yet. <br/>Start spending (or saving) to see charts!
            </div>
          )}
        </div>

        {/* Quick Stats & Goals Widget */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden">
             <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={20} className="text-emerald-200" />
                  <h3 className="font-bold">Monthly Summary</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-emerald-100">Net this month</span>
                    <span className={`font-bold ${income - expense >= 0 ? 'text-emerald-200' : 'text-rose-300'}`}>
                      ₹{(income - expense).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-100">Savings rate</span>
                    <span className="font-bold text-emerald-200">
                      {income > 0 ? Math.round(((income - expense) / income) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-100">Active wallets</span>
                    <span className="font-bold text-emerald-200">{wallets.length}</span>
                  </div>
                </div>
             </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4">Savings Progress</h3>
            <div className="space-y-4">
              {savingsGoals.slice(0, 3).map(goal => (
                <div key={goal.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">{goal.name}</span>
                    <span className="font-medium text-emerald-600">{Math.round((goal.current_amount / goal.target_amount) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full" 
                      style={{ width: `${Math.min((goal.current_amount / goal.target_amount) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
              {savingsGoals.length === 0 && <p className="text-sm text-slate-400">No active savings goals.</p>}
            </div>
          </div>
        </div>

      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-24 md:bottom-8 right-4 md:right-8 bg-emerald-600 hover:bg-emerald-700 text-white w-14 h-14 rounded-full shadow-xl shadow-emerald-500/30 flex items-center justify-center z-30 active:scale-95 transition-all"
        title="Add Transaction"
      >
        <Plus size={28} />
      </button>

      {/* Quick Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl md:rounded-2xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto pb-10 md:pb-6">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-slate-800">Quick Add</h3>
               <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 p-2 -mr-2">✕</button>
            </div>
            
            {wallets.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <WalletIcon className="text-amber-500" size={32} />
                </div>
                <h4 className="font-bold text-slate-700 mb-2">No Wallets Yet</h4>
                <p className="text-slate-500 text-sm mb-4">Create a wallet first to add transactions.</p>
                <a href="#/wallets" className="text-emerald-600 font-medium hover:text-emerald-700">
                  Go to Wallets →
                </a>
              </div>
            ) : (
              <form onSubmit={handleAddTransaction} className="space-y-5">
                
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => { setType(TransactionType.EXPENSE); setCategory(DEFAULT_CATEGORIES.find(c => c.type === TransactionType.EXPENSE)?.id || ''); }}
                    className={`flex-1 py-3 md:py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${type === TransactionType.EXPENSE ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <ArrowDown size={16} />
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => { setType(TransactionType.INCOME); setCategory(DEFAULT_CATEGORIES.find(c => c.type === TransactionType.INCOME)?.id || ''); }}
                    className={`flex-1 py-3 md:py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${type === TransactionType.INCOME ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <ArrowUp size={16} />
                    Income
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">₹</span>
                    <input 
                      type="number" 
                      inputMode="decimal"
                      value={amount} 
                      onChange={e => setAmount(e.target.value)}
                      className="w-full rounded-2xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 text-3xl font-bold py-4 pl-10 pr-4 bg-slate-50 border"
                      placeholder="0"
                      required
                      min="0"
                      step="0.01"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Category</label>
                     <select 
                       value={category}
                       onChange={e => setCategory(e.target.value)}
                       className="w-full rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 text-sm p-3 bg-slate-50 border appearance-none"
                     >
                       {DEFAULT_CATEGORIES.filter(c => c.type === type).map(c => (
                         <option key={c.id} value={c.id}>{c.name}</option>
                       ))}
                     </select>
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Wallet</label>
                     <select 
                       value={walletId}
                       onChange={e => setWalletId(e.target.value)}
                       className="w-full rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 text-sm p-3 bg-slate-50 border appearance-none"
                     >
                       {wallets.map(w => (
                         <option key={w.id} value={w.id}>{w.name}</option>
                       ))}
                     </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Date</label>
                    <input 
                      type="date" 
                      value={date} 
                      onChange={e => setDate(e.target.value)}
                      className="w-full rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 p-3 bg-slate-50 border text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Notes</label>
                    <input 
                      type="text" 
                      value={notes} 
                      onChange={e => setNotes(e.target.value)}
                      className="w-full rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 p-3 bg-slate-50 border text-sm"
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3.5 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition-colors bg-white border border-slate-200"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-[2] py-3.5 bg-emerald-600 text-white font-bold hover:bg-emerald-700 rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
                  >
                    Save
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
