
import React, { useState } from 'react';
import { User, Wallet, WalletType } from '../types';
import { dbService } from '../services/dbService';
import { Plus, CreditCard, Banknote, Smartphone, ArrowRightLeft } from 'lucide-react';
import { useData } from '../contexts/DataContext';

interface WalletsProps {
  user: User;
}

const Wallets: React.FC<WalletsProps> = ({ user }) => {
  const { wallets, refreshData } = useData();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  
  // New Wallet Form State
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<WalletType>(WalletType.BANK);
  const [newBalance, setNewBalance] = useState('');

  // Transfer Form State
  const [fromWalletId, setFromWalletId] = useState('');
  const [toWalletId, setToWalletId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);

  const handleAddWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newBalance) return;

    const newWallet: Wallet = {
      id: crypto.randomUUID(),
      user_id: user.id,
      name: newName,
      type: newType,
      balance: parseFloat(newBalance),
      currency: 'INR'
    };

    await dbService.db.addWallet(newWallet);
    setNewName('');
    setNewBalance('');
    setShowAddModal(false);
    refreshData();
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromWalletId || !toWalletId || !transferAmount || fromWalletId === toWalletId) return;
    
    const amount = parseFloat(transferAmount);
    const fromWallet = wallets.find(w => w.id === fromWalletId);
    
    if (!fromWallet || fromWallet.balance < amount) {
      alert('Insufficient balance in source wallet');
      return;
    }
    
    setTransferLoading(true);
    
    const result = await dbService.db.transferBetweenWallets(
      fromWalletId,
      toWalletId,
      amount,
      user.id,
      transferNotes
    );
    
    if (result.success) {
      setFromWalletId('');
      setToWalletId('');
      setTransferAmount('');
      setTransferNotes('');
      setShowTransferModal(false);
      refreshData(); // Real-time update
    } else {
      alert('Transfer failed. Please try again.');
    }
    
    setTransferLoading(false);
  };

  const getIcon = (type: WalletType) => {
    switch (type) {
      case WalletType.BANK: return <CreditCard className="text-blue-500" />;
      case WalletType.CASH: return <Banknote className="text-emerald-500" />;
      case WalletType.UPI: return <Smartphone className="text-purple-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800">My Wallets</h2>
        <div className="flex gap-2">
          {wallets.length >= 2 && (
            <button 
              onClick={() => setShowTransferModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 md:px-4 md:py-2 rounded-xl transition-colors font-medium shadow-sm shadow-blue-500/20 text-sm md:text-base"
            >
              <ArrowRightLeft size={20} />
              <span className="hidden md:inline">Transfer</span>
            </button>
          )}
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 md:px-4 md:py-2 rounded-xl transition-colors font-medium shadow-sm shadow-emerald-500/20 text-sm md:text-base"
          >
            <Plus size={20} />
            <span className="hidden md:inline">Add Wallet</span>
            <span className="md:hidden">Add</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 pb-24 md:pb-0">
        {wallets.map(wallet => (
          <div key={wallet.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
               {getIcon(wallet.type)}
            </div>
            <div className="flex items-center gap-4 mb-4 relative z-10">
              <div className="p-3 bg-slate-50 rounded-xl">
                {getIcon(wallet.type)}
              </div>
              <div>
                <h3 className="font-bold text-slate-800">{wallet.name}</h3>
                <p className="text-xs text-slate-500 uppercase font-medium tracking-wider">{wallet.type}</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800 relative z-10">
              {wallet.currency === 'INR' ? '₹' : wallet.currency} {wallet.balance.toLocaleString()}
            </p>
          </div>
        ))}
        {wallets.length === 0 && (
          <div className="col-span-full p-12 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
            <div className="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
              <CreditCard className="opacity-50" />
            </div>
            <p>No wallets found. Add one to get started!</p>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl md:rounded-2xl w-full max-w-md p-6 shadow-xl pb-10 md:pb-6">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-slate-800">Add New Wallet</h3>
               <button onClick={() => setShowAddModal(false)} className="text-slate-400 p-2 -mr-2 md:hidden">Close</button>
            </div>
            
            <form onSubmit={handleAddWallet} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Wallet Name</label>
                <input 
                  type="text" 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)}
                  className="w-full rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 p-3 bg-slate-50 border"
                  placeholder="e.g., HDFC Bank"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {[WalletType.BANK, WalletType.CASH, WalletType.UPI].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewType(t)}
                      className={`py-2 px-1 rounded-lg text-sm font-medium border capitalize ${newType === t ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-600'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Starting Balance</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input 
                    type="number" 
                    inputMode="decimal"
                    value={newBalance} 
                    onChange={e => setNewBalance(e.target.value)}
                    className="w-full rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 p-3 pl-8 bg-slate-50 border font-medium"
                    placeholder="0.00"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition-colors bg-white border border-slate-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-[2] py-3 bg-emerald-600 text-white font-medium hover:bg-emerald-700 rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
                >
                  Create Wallet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl md:rounded-2xl w-full max-w-md p-6 shadow-xl pb-10 md:pb-6">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-slate-800">Transfer Between Wallets</h3>
               <button onClick={() => setShowTransferModal(false)} className="text-slate-400 p-2 -mr-2 md:hidden">Close</button>
            </div>
            
            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">From Wallet</label>
                <select
                  value={fromWalletId}
                  onChange={e => setFromWalletId(e.target.value)}
                  className="w-full rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500 p-3 bg-slate-50 border"
                  required
                >
                  <option value="">Select source wallet</option>
                  {wallets.filter(w => w.id !== toWalletId).map(wallet => (
                    <option key={wallet.id} value={wallet.id}>
                      {wallet.name} (₹{wallet.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-center">
                <div className="bg-blue-50 p-2 rounded-full">
                  <ArrowRightLeft className="text-blue-600" size={24} />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">To Wallet</label>
                <select
                  value={toWalletId}
                  onChange={e => setToWalletId(e.target.value)}
                  className="w-full rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500 p-3 bg-slate-50 border"
                  required
                >
                  <option value="">Select destination wallet</option>
                  {wallets.filter(w => w.id !== fromWalletId).map(wallet => (
                    <option key={wallet.id} value={wallet.id}>
                      {wallet.name} (₹{wallet.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input 
                    type="number" 
                    inputMode="decimal"
                    value={transferAmount} 
                    onChange={e => setTransferAmount(e.target.value)}
                    className="w-full rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500 p-3 pl-8 bg-slate-50 border font-medium"
                    placeholder="0.00"
                    required
                    min="0.01"
                    step="0.01"
                  />
                </div>
                {fromWalletId && (
                  <p className="text-xs text-slate-500 mt-1">
                    Available: ₹{wallets.find(w => w.id === fromWalletId)?.balance.toLocaleString() || 0}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
                <input 
                  type="text" 
                  value={transferNotes} 
                  onChange={e => setTransferNotes(e.target.value)}
                  className="w-full rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500 p-3 bg-slate-50 border"
                  placeholder="e.g., Savings transfer"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 py-3 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition-colors bg-white border border-slate-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={transferLoading || !fromWalletId || !toWalletId || fromWalletId === toWalletId}
                  className="flex-[2] py-3 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-xl transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {transferLoading ? 'Transferring...' : 'Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallets;
