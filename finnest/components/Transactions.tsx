
import React, { useState, useEffect } from 'react';
import { User, Transaction, TransactionType } from '../types';
import { dbService } from '../services/dbService';
import { Plus, ArrowDown, ArrowUp, Calendar } from 'lucide-react';
import { DEFAULT_CATEGORIES } from '../constants';
import { useData } from '../contexts/DataContext';

interface TransactionsProps {
  user: User;
}

const Transactions: React.FC<TransactionsProps> = ({ user }) => {
  const { transactions, wallets, refreshData } = useData();
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

  const getCategoryName = (id: string) => DEFAULT_CATEGORIES.find(c => c.id === id)?.name || 'Unknown';
  const getWalletName = (id: string) => wallets.find(w => w.id === id)?.name || 'Unknown';

  // Group transactions by Date
  const groupedTransactions = transactions.reduce((groups, tx) => {
    const d = new Date(tx.date);
    const dateStr = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    
    // Check if it's today or yesterday for nicer headers
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    let header = dateStr;
    if (d.toDateString() === today.toDateString()) header = "Today";
    else if (d.toDateString() === yesterday.toDateString()) header = "Yesterday";

    if (!groups[header]) {
      groups[header] = [];
    }
    groups[header].push(tx);
    return groups;
  }, {} as Record<string, Transaction[]>);

  // Sort groups (Today first)
  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => {
    if (a === 'Today') return -1;
    if (b === 'Today') return 1;
    if (a === 'Yesterday') return -1;
    if (b === 'Yesterday') return 1;
    return new Date(b).getTime() - new Date(a).getTime(); // Fallback approximation
  });

  return (
    <div className="max-w-4xl mx-auto relative min-h-[calc(100vh-150px)]">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800">Transactions</h2>
        {/* Desktop Add Button */}
        <button 
          onClick={() => setShowAddModal(true)}
          className="hidden md:flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl transition-colors font-medium shadow-sm shadow-emerald-500/20"
        >
          <Plus size={20} />
          Add New
        </button>
      </div>

      <div className="space-y-6 mb-24 md:mb-0">
        {transactions.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <Calendar size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-700">No transactions yet</h3>
            <p className="text-slate-400">Add your first income or expense to get started!</p>
          </div>
        ) : (
          sortedDates.map(dateHeader => (
            <div key={dateHeader}>
              <h3 className="text-sm font-bold text-slate-500 mb-3 px-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full opacity-50"></span>
                {dateHeader}
              </h3>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
                {groupedTransactions[dateHeader].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(tx => (
                  <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors active:bg-slate-100">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className={`p-2.5 md:p-3 rounded-xl shrink-0 ${tx.type === TransactionType.INCOME ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        {tx.type === TransactionType.INCOME ? <ArrowUp size={18} md:size={20} /> : <ArrowDown size={18} md:size={20} />}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-800 truncate text-sm md:text-base">{getCategoryName(tx.category_id)}</h4>
                        <p className="text-xs text-slate-500 truncate">
                          {getWalletName(tx.wallet_id)} {tx.notes && `• ${tx.notes}`}
                        </p>
                      </div>
                    </div>
                    <span className={`font-bold whitespace-nowrap ml-2 text-sm md:text-base ${tx.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-slate-800'}`}>
                      {tx.type === TransactionType.INCOME ? '+' : '-'} ₹{tx.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Mobile Floating Action Button */}
      <button 
        onClick={() => setShowAddModal(true)}
        className="md:hidden fixed bottom-24 right-4 bg-emerald-600 text-white w-14 h-14 rounded-full shadow-xl shadow-emerald-500/30 flex items-center justify-center z-30 active:scale-95 transition-transform"
      >
        <Plus size={28} />
      </button>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl md:rounded-2xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto pb-10 md:pb-6">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-slate-800">Add Transaction</h3>
               <button onClick={() => setShowAddModal(false)} className="text-slate-400 p-2 -mr-2 md:hidden">Close</button>
            </div>
            
            <form onSubmit={handleAddTransaction} className="space-y-5">
              
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setType(TransactionType.EXPENSE)}
                  className={`flex-1 py-3 md:py-2 rounded-lg text-sm font-medium transition-all ${type === TransactionType.EXPENSE ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setType(TransactionType.INCOME)}
                  className={`flex-1 py-3 md:py-2 rounded-lg text-sm font-medium transition-all ${type === TransactionType.INCOME ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
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
                       <option key={w.id} value={w.id}>{w.name} (₹{w.balance})</option>
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
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
