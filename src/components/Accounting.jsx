import React, { useState, useEffect } from 'react';

export default function Accounting() {
  const [pl, setPL] = useState({ revenue: 0, expenses: 0, profit: 0 });
  const [expense, setExpense] = useState({ description: '', amount: '' });

  const loadPL = () => {
    fetch('http://localhost:5000/api/accounting/profit-loss')
      .then(res => res.json())
      .then(setPL)
      .catch(err => console.error(err));
  };

  useEffect(() => { loadPL(); }, []);

  const addExpense = async () => {
    await fetch('http://localhost:5000/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...expense, amount: parseFloat(expense.amount) })
    });
    setExpense({ description: '', amount: '' });
    loadPL();
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', height: '100%' }}>
      <h2>Accounting</h2>
      
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <div className="glass-panel" style={{ flex: 1, padding: '15px', background:'rgba(74, 222, 128, 0.1)' }}>
          <h3>Revenue</h3>
          <p style={{ fontSize: '28px', margin:0 }}>GHS {pl.revenue}</p>
        </div>
        <div className="glass-panel" style={{ flex: 1, padding: '15px', background:'rgba(248, 113, 113, 0.1)' }}>
          <h3>Expenses</h3>
          <p style={{ fontSize: '28px', margin:0 }}>GHS {pl.expenses}</p>
        </div>
        <div className="glass-panel" style={{ flex: 1, padding: '15px', background:'rgba(255, 255, 255, 0.1)' }}>
          <h3>Net Profit</h3>
          <p style={{ fontSize: '28px', margin:0, color: pl.profit >= 0 ? '#4ade80' : '#f87171' }}>
            GHS {pl.profit}
          </p>
        </div>
      </div>

      <h3>Record New Expense</h3>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input className="glass-input" placeholder="Description (e.g. Rent)" value={expense.description} onChange={e => setExpense({...expense, description: e.target.value})} />
        <input className="glass-input" placeholder="Amount" type="number" style={{width:'150px'}} value={expense.amount} onChange={e => setExpense({...expense, amount: e.target.value})} />
        <button className="glass-btn" onClick={addExpense}>Add Expense</button>
      </div>
    </div>
  );
}