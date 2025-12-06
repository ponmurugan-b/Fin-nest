
import React, { useState } from 'react';
import { User, SavingsGoal } from '../types';
import { dbService } from '../services/dbService';
import { Plus, Target } from 'lucide-react';
import { useData } from '../contexts/DataContext';

interface SavingsProps {
  user: User;
}

const Savings: React.FC<SavingsProps> = ({ user }) => {
  const { savingsGoals, refreshData } = useData();
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('0');
  const [deadline, setDeadline] = useState('');

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !target) return;

    const newGoal: SavingsGoal = {
      id: crypto.randomUUID(),
      user_id: user.id,
      name,
      target_amount: parseFloat(target),
      current_amount: parseFloat(current),
      deadline: deadline || undefined
    };

    await dbService.db.addSavingsGoal(newGoal);
    setShowModal(false);
    setName('');
    setTarget('');
    setCurrent('0');
    setDeadline('');
    refreshData();
  };

  const handleUpdateProgress = async (goal: SavingsGoal, amount: number) => {
    const updated = { ...goal, current_amount: goal.current_amount + amount };
    if (updated.current_amount < 0) updated.current_amount = 0;
    await dbService.db.updateSavingsGoal(updated);
    refreshData();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800">Savings Goals</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 md:px-4 md:py-2 rounded-xl transition-colors font-medium shadow-sm shadow-emerald-500/20 text-sm md:text-base"
        >
          <Plus size={20} />
          <span className="hidden md:inline">New Goal</span>
          <span className="md:hidden">Add</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pb-24 md:pb-0">
        {savingsGoals.map(goal => {
          const percent = Math.min(Math.round((goal.current_amount / goal.target_amount) * 100), 100);
          return (
            <div key={goal.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                   <h3 className="font-bold text-lg text-slate-800">{goal.name}</h3>
                   {goal.deadline && (
                     <p className="text-xs text-slate-500 mt-1">Due: {new Date(goal.deadline).toLocaleDateString()}</p>
                   )}
                </div>
                <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600">
                  <Target size={20} />
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2 font-medium">
                  <span className="text-slate-600">₹{goal.current_amount.toLocaleString()}</span>
                  <span className="text-slate-400">of ₹{goal.target_amount.toLocaleString()}</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="text-right mt-1 text-xs font-bold text-emerald-600">{percent}%</div>
              </div>

              <div className="mt-auto flex gap-2">
                <button 
                  onClick={() => handleUpdateProgress(goal, 1000)}
                  className="flex-1 py-2 bg-emerald-50 text-emerald-700 font-medium text-sm rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  + ₹1k
                </button>
                 <button 
                  onClick={() => handleUpdateProgress(goal, 5000)}
                  className="flex-1 py-2 bg-emerald-50 text-emerald-700 font-medium text-sm rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  + ₹5k
                </button>
              </div>
            </div>
          );
        })}
        
        {savingsGoals.length === 0 && (
          <div className="col-span-full p-8 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
            No savings goals yet. Dream big!
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl md:rounded-2xl w-full max-w-md p-6 shadow-xl pb-10 md:pb-6">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-slate-800">Create Goal</h3>
               <button onClick={() => setShowModal(false)} className="text-slate-400 p-2 -mr-2 md:hidden">Close</button>
            </div>
             <form onSubmit={handleAddGoal} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Goal Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full rounded-xl border-slate-200 p-3 bg-slate-50 border" placeholder="e.g. New iPhone" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Target Amount (₹)</label>
                  <input type="number" inputMode="decimal" value={target} onChange={e => setTarget(e.target.value)} className="w-full rounded-xl border-slate-200 p-3 bg-slate-50 border" placeholder="0.00" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Saved Already (₹)</label>
                  <input type="number" inputMode="decimal" value={current} onChange={e => setCurrent(e.target.value)} className="w-full rounded-xl border-slate-200 p-3 bg-slate-50 border" placeholder="0.00" />
                </div>
                 <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Deadline (Optional)</label>
                  <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full rounded-xl border-slate-200 p-3 bg-slate-50 border" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3.5 text-slate-600 font-medium hover:bg-slate-50 rounded-xl bg-white border border-slate-200">Cancel</button>
                  <button type="submit" className="flex-[2] py-3.5 bg-emerald-600 text-white font-medium hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-500/20">Create Goal</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Savings;
