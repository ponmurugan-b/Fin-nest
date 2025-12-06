
import React from 'react';
import { User } from '../types';
import { dbService } from '../services/dbService';
import { Download } from 'lucide-react';

interface ReportsProps {
  user: User;
}

const Reports: React.FC<ReportsProps> = ({ user }) => {

  const downloadCSV = async () => {
    const transactions = await dbService.db.getTransactions(user.id);
    
    if (transactions.length === 0) {
      alert("No data to export!");
      return;
    }

    const headers = ["ID", "Date", "Type", "Amount", "Category", "Wallet", "Notes"];
    const csvContent = [
      headers.join(","),
      ...transactions.map(t => [
        t.id,
        t.date,
        t.type,
        t.amount,
        t.category_id,
        t.wallet_id,
        `"${t.notes || ''}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `finnest_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-8">Reports & Export</h2>
      
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center">
        <div className="bg-emerald-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Download className="text-emerald-600" size={32} />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Export Data</h3>
        <p className="text-slate-500 mb-6 max-w-md mx-auto">Download your complete transaction history as a CSV file for use in Excel or other financial tools.</p>
        
        <button 
          onClick={downloadCSV}
          className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-medium transition-colors inline-flex items-center gap-2"
        >
          <Download size={20} />
          Download CSV
        </button>
      </div>
    </div>
  );
};

export default Reports;
