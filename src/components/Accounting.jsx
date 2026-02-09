import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartPie, faList, faPlus, faSave, faTimes, faPrint, faMoneyBillWave, faCreditCard, faMobileAlt, faEdit, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { formatCurrency } from '../utils';
import { ACCOUNT_HIERARCHY } from '../constants/accounts';

// --- CONSTANTS ---
const MONTHS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' }
];

const WEEKS = [
  { value: '1', label: 'Week 1' },
  { value: '2', label: 'Week 2' },
  { value: '3', label: 'Week 3' },
  { value: '4', label: 'Week 4' },
  { value: '5', label: 'Week 5' }
];

const generateYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = 2025; i <= currentYear + 10; i++) {
    years.push(i.toString());
  }
  return years;
};

const YEARS = generateYears();

const getMonthWeekRange = (year, monthValue, weekIndex) => {
  const monthIndex = parseInt(monthValue) - 1; 
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const daysToAdd = (8 - firstDayOfMonth.getDay()) % 7;
  const firstMonday = new Date(year, monthIndex, 1 + daysToAdd);
  const startDate = new Date(firstMonday);
  startDate.setDate(firstMonday.getDate() + (parseInt(weekIndex) - 1) * 7);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  const startStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0],
    label: `${MONTHS.find(m => m.value === monthValue).label} Week ${weekIndex} (${startStr} - ${endStr})`
  };
};

export default function Accounting({ theme, showToast }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedParent, setSelectedParent] = useState(null);
  const [selectedChild, setSelectedChild] = useState('');   
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    taxAmount: '',
    paymentMode: 'CASH',
    description: ''
  });

  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    totalTax: 0,
    stockLoss: 0
  });

  const [recentTransactions, setRecentTransactions] = useState([
    { id: 1, date: '2026-02-07', code: '4010', desc: 'Daily Sales - Beverages', amount: 150.00, type: 'INCOME', paymentMode: 'MOMO' },
    { id: 2, date: '2026-02-07', code: '4010', desc: 'Daily Sales - Snacks', amount: 85.50, type: 'INCOME', paymentMode: 'CARD' },
    { id: 3, date: '2026-02-07', code: '4010', desc: 'Daily Sales - Groceries', amount: 320.00, type: 'INCOME', paymentMode: 'CASH' },
    { id: 4, date: '2026-02-06', code: '4010', desc: 'Daily Sales - Stationery', amount: 210.00, type: 'INCOME', paymentMode: 'CASH' },
    { id: 5, date: '2026-02-06', code: '4010', desc: 'Daily Sales - Toiletries', amount: 180.00, type: 'INCOME', paymentMode: 'MOMO' },
    { id: 14, date: '2026-02-06', code: '4010', desc: 'Daily Sales - Bulk Items', amount: 550.00, type: 'INCOME', paymentMode: 'CARD' },
    { id: 6, date: '2026-02-07', code: '6210', desc: 'Shop Rent Payment', amount: 2000.00, type: 'EXPENSE', paymentMode: 'CASH' },
    { id: 9, date: '2026-02-07', code: '6230', desc: 'Cleaning Supplies', amount: 85.00, type: 'EXPENSE', paymentMode: 'CASH' },
    { id: 13, date: '2026-02-06', code: '6210', desc: 'Office Supplies', amount: 45.00, type: 'EXPENSE', paymentMode: 'CASH' },
    { id: 101, date: '2026-01-15', code: '6240', desc: 'Staff Wages - Cashier 1', amount: 800.00, type: 'EXPENSE', paymentMode: 'CASH' },
    { id: 102, date: '2026-01-20', code: '4010', desc: 'Daily Sales - Food', amount: 400.00, type: 'INCOME', paymentMode: 'CASH' },
    { id: 7, date: '2026-02-05', code: '6220', desc: 'Utility Bill - Electricity', amount: 450.00, type: 'EXPENSE', paymentMode: 'CASH' },
    { id: 8, date: '2026-02-05', code: '6220', desc: 'Utility Bill - Water', amount: 120.00, type: 'EXPENSE', paymentMode: 'CASH' },
    { id: 10, date: '2026-02-01', code: '6240', desc: 'Staff Wages - Cashier 1', amount: 800.00, type: 'EXPENSE', paymentMode: 'CASH' },
    { id: 11, date: '2026-02-01', code: '6240', desc: 'Staff Wages - Cashier 2', amount: 800.00, type: 'EXPENSE', paymentMode: 'CASH' },
    { id: 12, date: '2026-02-01', code: '6240', desc: 'Staff Incentives', amount: 200.00, type: 'EXPENSE', paymentMode: 'CASH' },
  ]);

  const formRef = useRef(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configTarget, setConfigTarget] = useState(null);
  
  const [periodFilter, setPeriodFilter] = useState({
    type: 'weekly',
    startYear: new Date().getFullYear().toString(),
    startMonth: (new Date().getMonth() + 1).toString().padStart(2, '0'),
    startWeek: '1',
    endYear: new Date().getFullYear().toString(),
    endMonth: (new Date().getMonth() + 1).toString().padStart(2, '0'),
    endWeek: '1',
    specificDate: new Date().toISOString().split('T')[0]
  });

  const [activeReportModal, setActiveReportModal] = useState(null);

  useEffect(() => {
    setMetrics({
      totalRevenue: 150000,
      totalExpenses: 120000,
      totalTax: 13500,
      netProfit: 16500,
      stockLoss: 0
    });
  }, []);

  // --- Date Formatter Helper ---
  const formatDateDisplay = (dateString) => {
    if (!dateString) return '';
    // dateString is expected to be YYYY-MM-DD
    const parts = dateString.split('-'); 
    if (parts.length !== 3) return dateString;
    return `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
  };

  const handleEntrySubmit = (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    
    if (!selectedChild) {
      showToast("Please select an item code.");
      return;
    }
    const hierarchy = ACCOUNT_HIERARCHY || []; 
    const childObj = hierarchy
      .flatMap(p => p.children || [])
      .find(c => c.id === selectedChild);
    if (!childObj) {
      showToast("Invalid Account Code selected.");
      return;
    }
    const newTransaction = {
      id: Date.now(),
      date: formData.date,
      code: childObj.id,
      desc: formData.description || childObj.name,
      amount: parseFloat(formData.amount),
      type: selectedParent,
      paymentMode: formData.paymentMode
    };
    setRecentTransactions([newTransaction, ...recentTransactions]);
    showToast('Transaction Recorded Successfully!');
    setFormData({
      date: new Date().toISOString().split('T')[0],
      amount: '',
      taxAmount: '',
      paymentMode: 'CASH',
      description: ''
    });
    setSelectedChild('');
  };

  const getDailySalesStats = () => {
    const sales = recentTransactions.filter(t => t.type === 'INCOME');
    const total = sales.reduce((acc, t) => acc + t.amount, 0);
    const cash = sales.filter(t => t.paymentMode === 'CASH').reduce((acc, t) => acc + t.amount, 0);
    const momo = sales.filter(t => t.paymentMode === 'MOMO').reduce((acc, t) => acc + t.amount, 0);
    const card = sales.filter(t => t.paymentMode === 'CARD').reduce((acc, t) => acc + t.amount, 0);
    return { total, cash, momo, card, count: sales.length };
  };

  const dailyStats = getDailySalesStats();

  const getFilteredTransactions = (filter) => {
    if (!filter) return recentTransactions;
    if (filter.type === 'daily') return recentTransactions.filter(t => t.date === filter.specificDate);
    if (filter.type === 'annual') {
      const startYear = parseInt(filter.startYear);
      const endYear = parseInt(filter.endYear);
      return recentTransactions.filter(t => {
        const year = parseInt(t.date.split('-')[0]);
        return year >= startYear && year <= endYear;
      });
    }
    if (filter.type === 'monthly') {
      const startDateStr = `${filter.startYear}-${filter.startMonth}-01`;
      const endYear = parseInt(filter.endYear);
      const endMonth = parseInt(filter.endMonth);
      const lastDay = new Date(endYear, endMonth, 0).getDate();
      const endDateStr = `${endYear}-${filter.endMonth}-${lastDay.toString().padStart(2, '0')}`;
      return recentTransactions.filter(t => {
        return t.date >= startDateStr && t.date <= endDateStr;
      });
    }
    if (filter.type === 'weekly') {
      const startRange = getMonthWeekRange(parseInt(filter.startYear), filter.startMonth, filter.startWeek);
      const endRange = getMonthWeekRange(parseInt(filter.endYear), filter.endMonth, filter.endWeek);
      return recentTransactions.filter(t => {
        return t.date >= startRange.start && t.date <= endRange.end;
      });
    }
    return recentTransactions;
  };

  const getReportData = (reportName, filter) => {
    const transactions = getFilteredTransactions(filter);
    let periodLabel = '';
    
    // Format Period Label based on type
    if (filter.type === 'daily') periodLabel = formatDateDisplay(filter.specificDate);
    else if (filter.type === 'annual') periodLabel = `${filter.startYear} - ${filter.endYear}`;
    else if (filter.type === 'monthly') periodLabel = `${MONTHS.find(m=>m.value===filter.startMonth).label} ${filter.startYear} to ${MONTHS.find(m=>m.value===filter.endMonth).label} ${filter.endYear}`;
    else if (filter.type === 'weekly') {
      const startRange = getMonthWeekRange(parseInt(filter.startYear), filter.startMonth, filter.startWeek);
      periodLabel = startRange.label;
    }
    
    let title = reportName;
    if (reportName === 'Monthly Profit & Loss') title = 'Profit & Loss Statement';
    if (reportName === 'Daily Sales Report' || reportName === 'Daily Cash Inflow') title = 'Sales & Cash Inflow Report';
    
    if (reportName === 'Monthly Profit & Loss') {
      const income = transactions.filter(t => t.type === 'INCOME').reduce((a, b) => a + b.amount, 0);
      const expense = transactions.filter(t => t.type === 'EXPENSE').reduce((a, b) => a + b.amount, 0);
      return {
        title,
        type: 'summary',
        periodLabel,
        content: [
          { label: 'Total Revenue', value: formatCurrency(income), color: '#10b981' },
          { label: 'Total Expenses', value: formatCurrency(expense), color: '#ef4444' },
          { label: 'Net Profit / (Loss)', value: formatCurrency(income - expense), color: income >= expense ? '#10b981' : '#ef4444', highlight: true }
        ]
      };
    }
    if (reportName === 'Expense Summary') {
      const expenses = transactions.filter(t => t.type === 'EXPENSE');
      const totalExpense = expenses.reduce((a, b) => a + b.amount, 0);
      return {
        title: 'Expense Breakdown',
        type: 'table',
        periodLabel,
        headers: ['Date', 'Description', 'Code', 'Payment Mode', 'Amount'],
        // Format Date in Rows
        rows: expenses.map(t => [formatDateDisplay(t.date), t.desc, t.code, t.paymentMode, formatCurrency(t.amount)]),
        summary: formatCurrency(totalExpense)
      };
    }
    if (reportName === 'Staff Cost Report') {
      const staff = transactions.filter(t => t.code === '6240');
      const total = staff.reduce((a, b) => a + b.amount, 0);
      return {
        title: 'Staff Cost Analysis',
        type: 'table',
        periodLabel,
        headers: ['Date', 'Description', 'Code', 'Amount'],
        // Format Date in Rows
        rows: staff.map(t => [formatDateDisplay(t.date), t.desc, t.code, formatCurrency(t.amount)]),
        summary: formatCurrency(total)
      };
    }
    if (reportName === 'Cash Summary') {
      const cashIn = transactions.filter(t => t.paymentMode === 'CASH' && t.type === 'INCOME').reduce((a, b) => a + b.amount, 0);
      const cashOut = transactions.filter(t => t.paymentMode === 'CASH' && t.type === 'EXPENSE').reduce((a, b) => a + b.amount, 0);
      return {
        title: 'Cash Flow Statement',
        type: 'summary',
        periodLabel,
        content: [
          { label: 'Total Cash Inflow', value: formatCurrency(cashIn), color: '#10b981' },
          { label: 'Total Cash Outflow', value: formatCurrency(cashOut), color: '#ef4444' },
          { label: 'Net Cash Position', value: formatCurrency(cashIn - cashOut), color: '#3b82f6', highlight: true }
        ]
      };
    }
    if (reportName === 'GST/VAT Summary') {
      const income = transactions.filter(t => t.type === 'INCOME').reduce((a, b) => a + b.amount, 0);
      const tax = income * 0.18;
      return {
        title: 'Tax Liability Report',
        type: 'summary',
        periodLabel,
        content: [
          { label: 'Taxable Income', value: formatCurrency(income), color: '#374151' },
          { label: 'Estimated VAT/GST (18%)', value: formatCurrency(tax), color: '#8b5cf6', highlight: true },
          { label: 'Status', value: 'Payable', color: '#f59e0b' }
        ]
      };
    }
    if (reportName === 'Trial Balance') {
      const income = transactions.filter(t => t.type === 'INCOME').reduce((a, b) => a + b.amount, 0);
      const expense = transactions.filter(t => t.type === 'EXPENSE').reduce((a, b) => a + b.amount, 0);
      return {
        title: 'Trial Balance',
        type: 'summary',
        periodLabel,
        content: [
          { label: 'Total Credits (Income)', value: formatCurrency(income), color: '#374151' },
          { label: 'Total Debits (Expenses)', value: formatCurrency(expense), color: '#374151' },
          { label: 'Difference', value: formatCurrency(Math.abs(income - expense)), color: income === expense ? '#10b981' : '#ef4444' }
        ]
      };
    }
    if (reportName === 'Daily Sales Report' || reportName === 'Daily Cash Inflow') {
      const income = transactions.filter(t => t.type === 'INCOME');
      const totalIncome = income.reduce((a, b) => a + b.amount, 0);
      return {
        title: 'Sales Report',
        type: 'table',
        periodLabel,
        headers: ['Date', 'Description', 'Code', 'Payment Mode', 'Amount'],
        // Format Date in Rows
        rows: income.map(t => [formatDateDisplay(t.date), t.desc, t.code, t.paymentMode, formatCurrency(t.amount)]),
        summary: formatCurrency(totalIncome)
      };
    }
    return { title: 'Report', type: 'empty', periodLabel };
  };

  const reportData = activeReportModal ? getReportData(activeReportModal.name, activeReportModal.filter) : null;

  const textColor = 'var(--text-color)';
  const labelColor = 'var(--text-color)';

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 'bold',
    fontSize: '14px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase'
  };

  const handleFilterChange = (field, value) => {
    setPeriodFilter(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'visible', padding: '20px' }}>
      
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .modal-overlay { background: white !important; }
          .report-paper {
            width: 100% !important;
            box-shadow: none !important;
            margin: 0 !important;
            border: none !important;
            padding: 0 !important; 
            max-height: none !important;
          }
          body { 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact;
            background: white;
          }
        }
      `}</style>

      <div style={{ display: 'flex', gap: '5px', marginBottom: '20px', flexShrink: 0 }}>
        <div className="glass-panel" style={{ display: 'flex', gap: '5px', padding: '5px', borderRadius: '10px' }}>
          {[
            { id: 'overview', label: 'Overview', icon: faChartPie },
            { id: 'entry', label: 'Transaction Entry', icon: faPlus },
            { id: 'reports', label: 'Reports', icon: faList }
          ].map(tab => (
            <button
              key={tab.id}
              className={`glass-btn ${activeTab === tab.id ? 'active-tab' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              style={{ 
                padding: '12px 24px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px', 
                borderRadius: '6px', 
                fontSize: '18px', 
                border: 'none', 
                color: textColor,
                background: activeTab === tab.id ? 'var(--glass-btn-hover-bg)' : 'transparent'
              }}
            >
              <FontAwesomeIcon icon={tab.icon} style={{ color: textColor, opacity: activeTab === tab.id ?1 : 0.7 }} />
              <span style={{fontWeight: 'bold'}}>{tab.label}</span>
            </button>
          ))}
        </div>
        {activeTab === 'entry' && selectedParent && (
          <button onClick={() => handleEntrySubmit()} className="glass-btn" style={{ padding: '12px 24px', fontSize: '16px', fontWeight: 'bold', background: 'rgba(16, 185, 129, 0.2)', borderColor: '#4ade80', color: '#4ade80', whiteSpace: 'nowrap' }}>
            <FontAwesomeIcon icon={faSave} style={{marginRight: '8px'}} /> SAVE TRANSACTION
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'visible', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
            <div className="glass-panel" style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: '20px' }}>
              <h4 style={{ margin: 0, color: labelColor, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Finance Summary</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', width: '100%' }}>
                <div className="glass-panel" style={{ padding: '20px', display:'flex', flexDirection:'column', justifyContent:'center', alignItems: 'center', background: 'rgba(34, 197, 94, 0.1)', height: '100%' }}>
                  <h3 style={{margin:'0 0 10px 0', opacity:0.8, color: textColor, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px'}}>Total Revenue</h3>
                  <p style={{fontSize:'24px', fontWeight:'bold', margin: 0, color: textColor}}>{formatCurrency(metrics.totalRevenue)}</p>
                </div>
                <div className="glass-panel" style={{ padding: '20px', display:'flex', flexDirection:'column', justifyContent:'center', alignItems: 'center', background: 'rgba(239, 68, 68, 0.1)', height: '100%' }}>
                  <h3 style={{margin:'0 0 10px 0', opacity:0.8, color: textColor, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px'}}>Total Expenses</h3>
                  <p style={{fontSize:'24px', fontWeight:'bold', margin: 0, color: textColor}}>{formatCurrency(metrics.totalExpenses)}</p>
                </div>
                <div className="glass-panel" style={{ padding: '20px', display:'flex', flexDirection:'column', justifyContent:'center', alignItems: 'center', background: 'rgba(16, 185, 129, 0.1)', height: '100%' }}>
                  <h3 style={{margin:'0 0 10px 0', opacity:0.8, color: textColor, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px'}}>Net Profit</h3>
                  <p style={{fontSize:'24px', fontWeight:'bold', margin: 0, color: textColor}}>{formatCurrency(metrics.netProfit)}</p>
                </div>
                <div className="glass-panel" style={{ padding: '20px', display:'flex', flexDirection:'column', justifyContent:'center', alignItems: 'center', background: 'rgba(139, 92, 246, 0.1)', height: '100%' }}>
                  <h3 style={{margin:'0 0 10px 0', opacity:0.8, color: textColor, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px'}}>Total Tax</h3>
                  <p style={{fontSize:'24px', fontWeight:'bold', margin: 0, color: textColor}}>{formatCurrency(metrics.totalTax)}</p>
                </div>
              </div>
            </div>
            <div className="glass-panel" style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h4 style={{ margin: 0, color: labelColor, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Daily Cash Inflow</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                <div className="glass-panel" style={{ padding: '20px', display:'flex', flexDirection:'column', justifyContent:'center', alignItems: 'center', background: 'var(--glass-btn-bg)', height: '80%' }}>
                  <FontAwesomeIcon icon={faMoneyBillWave} style={{ fontSize: '32px', color: 'var(--icon-muted)', marginBottom: '10px' }} />
                  <h3 style={{margin:'0 0 10px 0', opacity:0.9, color: textColor, fontSize: '16px', textTransform: 'uppercase', letterSpacing: '1px'}}>Cash</h3>
                  <p style={{fontSize:'28px', fontWeight:'bold', margin: 0, color: '#10b981'}}>{formatCurrency(dailyStats.cash)}</p>
                  <small style={{opacity: 0.6, fontSize: '12px', color: textColor}}>Inflow</small>
                </div>
                <div className="glass-panel" style={{ padding: '20px', display:'flex', flexDirection:'column', justifyContent:'center', alignItems: 'center', background: 'var(--glass-btn-bg)', height: '80%' }}>
                  <FontAwesomeIcon icon={faMobileAlt} style={{ fontSize: '32px', color: 'var(--icon-muted)', marginBottom: '10px' }} />
                  <h3 style={{margin:'0 0 10px 0', opacity:0.9, color: textColor, fontSize: '16px', textTransform: 'uppercase', letterSpacing: '1px'}}>MoMo</h3>
                  <p style={{fontSize:'28px', fontWeight:'bold', margin: 0, color: '#3b82f6'}}>{formatCurrency(dailyStats.momo)}</p>
                  <small style={{opacity: 0.6, fontSize: '12px', color: textColor}}>Inflow</small>
                </div>
                <div className="glass-panel" style={{ padding: '20px', display:'flex', flexDirection:'column', justifyContent:'center', alignItems: 'center', background: 'var(--glass-btn-bg)', height: '80%' }}>
                  <FontAwesomeIcon icon={faCreditCard} style={{ fontSize: '32px', color: 'var(--icon-muted)', marginBottom: '10px' }} />
                  <h3 style={{margin:'0 0 10px 0', opacity:0.9, color: textColor, fontSize: '16px', textTransform: 'uppercase', letterSpacing: '1px'}}>Card</h3>
                  <p style={{fontSize:'28px', fontWeight:'bold', margin: 0, color: '#ec4899'}}>{formatCurrency(dailyStats.card)}</p>
                  <small style={{opacity: 0.6, fontSize: '12px', color: textColor}}>Inflow</small>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'entry' && (
          <div style={{ display: 'flex', gap: '20px', height: '100%', overflow: 'visible' }}>
            <div className="glass-panel" style={{ flex: 1, padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '250px', overflow: 'auto' }}>
              <h3 style={{ marginTop: 0, marginBottom: '15px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px', color: textColor, fontSize: '20px' }}>Accounts</h3>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(ACCOUNT_HIERARCHY || []).filter(p => p.type !== 'LOSS').map((parent) => (
                  <button key={parent.id} onClick={() => setSelectedParent(parent.type)} className={`glass-btn ${selectedParent === parent.type ? 'active-tab' : ''}`} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', textAlign: 'left', background: selectedParent === parent.type ? 'var(--glass-btn-hover-bg)' : 'transparent', fontSize: '18px', border: 'none', color: textColor }}>
                    <span style={{ fontWeight: 'bold' }}>{parent.name}</span>
                    <FontAwesomeIcon icon={selectedParent === parent.type ? faEdit : faArrowRight} style={{color: textColor}} />
                  </button>
                ))}
              </div>
            </div>
            <div className="glass-panel" style={{ flex: 2, padding: '30px', display: 'flex', flexDirection: 'column', overflow: 'visible' }}>
              {!selectedParent ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5, fontSize: '18px' }}>Select an Account Category from left.</div>
              ) : (
                <form ref={formRef} onSubmit={handleEntrySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
                  <h3 style={{marginTop: 0, color: textColor, fontSize: '22px', flexShrink: 0}}>{selectedParent} Entry</h3>
                  <div style={{ flexShrink: 0 }}><label style={{...labelStyle, color: labelColor}}>Date</label><input type="date" className="glass-input" style={{fontSize: '18px'}} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required /></div>
                  <div style={{ flexShrink: 0 }}><label style={{...labelStyle, color: labelColor}}>{selectedParent === 'INCOME' ? 'Income Source' : 'Expense Category'}</label><select className="glass-input" style={{fontSize: '18px', padding: '12px'}} value={selectedChild} onChange={e => setSelectedChild(e.target.value)} required><option value="">Select Item...</option>{(ACCOUNT_HIERARCHY || []).filter(p => p.type === selectedParent).flatMap(p => p.children || []).map(child => (<option key={child.id} value={child.id}>{child.id} - {child.name}</option>))}</select></div>
                  <div style={{display: 'flex', gap: '15px', flexShrink: 0}}>
                    <div style={{flex: 1}}><label style={{...labelStyle, color: labelColor}}>Amount</label><input type="number" step="0.01" className="glass-input" style={{fontSize: '18px'}} value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="0.00" required /></div>
                    <div style={{flex: 1}}><label style={{...labelStyle, color: labelColor}}>Payment Mode</label><select className="glass-input" style={{fontSize: '18px'}} value={formData.paymentMode} onChange={e => setFormData({...formData, paymentMode: e.target.value})}><option value="CASH">Cash</option><option value="MOMO">MoMo</option><option value="CARD">Card / Bank</option></select></div>
                  </div>
                  <div style={{ flexShrink: 0 }}><label style={{...labelStyle, color: labelColor}}>GST/VAT Amount (Optional)</label><input type="number" step="0.01" className="glass-input" style={{fontSize: '18px'}} value={formData.taxAmount} onChange={e => setFormData({...formData, taxAmount: e.target.value})} placeholder="0.00" /></div>
                  <div style={{ display: 'flex', flexDirection: 'column', minHeight: '120px' }}><label style={{...labelStyle, color: labelColor}}>Description / Notes</label><textarea className="glass-input" style={{ height: '100px', resize: 'none', fontSize: '18px', lineHeight: '1.4' }} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Add details..." /></div>
                  <button type="submit" style={{ display: 'none' }} />
                </form>
              )}
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <h3 style={{ margin: 0, marginBottom: '20px', flexShrink: 0, color: textColor, fontSize: '22px', fontWeight: 'bold' }}>MiniMart Reports</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '30px', flex: '1', alignContent: 'start' }}>
              {[
                { name: 'Monthly Profit & Loss', desc: 'Income vs Expenses breakdown', color: 'green' },
                { name: 'Expense Summary', desc: 'View costs by category', color: 'red' },
                { name: 'Staff Cost Report', desc: 'Wages & incentives analysis', color: 'orange' },
                { name: 'Cash Summary', desc: 'Daily cash closing', color: 'yellow' },
                { name: 'GST/VAT Summary', desc: 'Tax payable status', color: 'indigo' },
                { name: 'Trial Balance', desc: 'System health check', color: 'gray' }
              ].map((report, i) => (
                <button 
                  key={i} 
                  className="glass-btn" 
                  onClick={() => { setConfigTarget(report.name); setShowConfigModal(true); }} 
                  style={{ 
                    padding: '20px', 
                    textAlign: 'center', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '10px', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    background: 'var(--glass-btn-bg)', 
                    border: '1px solid var(--glass-border)', 
                    minHeight: '120px', 
                    transition: 'transform 0.2s, background 0.2s', 
                    color: textColor 
                  }} 
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} 
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <span style={{fontWeight: 'bold', color: textColor, fontSize: '18px', lineHeight: '1.2'}}>{report.name}</span>
                  <span style={{fontSize: '14px', opacity: 0.6, fontWeight: 'normal'}}>{report.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {showConfigModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'var(--modal-overlay)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2100 }}>
          <div className="glass-panel" style={{ width: '500px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ margin: 0, color: textColor, fontSize: '20px' }}>Configure Report</h3>
            <div style={{ opacity: 0.7, fontSize: '14px', color: textColor }}>Generating: <strong>{configTarget}</strong></div>
            <div>
              <label style={{...labelStyle, color: labelColor}}>Period Type</label>
              <select className="glass-input" value={periodFilter.type} onChange={(e) => handleFilterChange('type', e.target.value)}><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly / Range</option><option value="annual">Annual</option></select>
            </div>
            {periodFilter.type === 'daily' && (
              <div>
                <label style={{...labelStyle, color: labelColor}}>Select Date</label>
                <input type="date" className="glass-input" value={periodFilter.specificDate} onChange={(e) => handleFilterChange('specificDate', e.target.value)} />
              </div>
            )}
            {periodFilter.type === 'weekly' && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ width: '100%' }}>
                  <label style={{...labelStyle, color: labelColor}}>Select Week</label>
                  <select className="glass-input" style={{ marginBottom: '5px' }} value={periodFilter.startYear} onChange={(e) => handleFilterChange('startYear', e.target.value)}>{YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select>
                  <select className="glass-input" style={{ marginBottom: '5px' }} value={periodFilter.startMonth} onChange={(e) => handleFilterChange('startMonth', e.target.value)}>{MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</select>
                  <select className="glass-input" value={periodFilter.startWeek} onChange={(e) => handleFilterChange('startWeek', e.target.value)}>{WEEKS.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}</select>
                </div>
              </div>
            )}
            {periodFilter.type === 'monthly' && (
              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{...labelStyle, color: labelColor}}>Start</label>
                  <select className="glass-input" style={{ marginBottom: '5px' }} value={periodFilter.startYear} onChange={(e) => handleFilterChange('startYear', e.target.value)}>{YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select>
                  <select className="glass-input" value={periodFilter.startMonth} onChange={(e) => handleFilterChange('startMonth', e.target.value)}>{MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{...labelStyle, color: labelColor}}>End</label>
                  <select className="glass-input" style={{ marginBottom: '5px' }} value={periodFilter.endYear} onChange={(e) => handleFilterChange('endYear', e.target.value)}>{YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select>
                  <select className="glass-input" value={periodFilter.endMonth} onChange={(e) => handleFilterChange('endMonth', e.target.value)}>{MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</select>
                </div>
              </div>
            )}
            {periodFilter.type === 'annual' && (
              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{...labelStyle, color: labelColor}}>Start Year</label>
                  <select className="glass-input" value={periodFilter.startYear} onChange={(e) => handleFilterChange('startYear', e.target.value)}>{YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{...labelStyle, color: labelColor}}>End Year</label>
                  <select className="glass-input" value={periodFilter.endYear} onChange={(e) => handleFilterChange('endYear', e.target.value)}>{YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button onClick={() => setShowConfigModal(false)} className="glass-btn" style={{ flex: 1, padding: '10px', background: 'var(--glass-btn-bg)', color: textColor }}>Cancel</button>
              <button onClick={() => {
                const finalFilter = { ...periodFilter };
                if (periodFilter.type === 'weekly') {
                  finalFilter.endYear = periodFilter.startYear;
                  finalFilter.endMonth = periodFilter.startMonth;
                  finalFilter.endWeek = periodFilter.startWeek;
                }
                setActiveReportModal({ name: configTarget, filter: finalFilter });
                setShowConfigModal(false);
              }} className="glass-btn" style={{ flex: 1, padding: '10px', background: 'rgba(59, 130, 246, 0.2)', borderColor: '#3b82f6', color: textColor }}>Generate</button>
            </div>
          </div>
        </div>
      )}

      {activeReportModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'var(--modal-overlay)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '20px' }}>
          
          {/* Report Modal Container */}
          <div className="glass-panel" style={{ width: '100%', maxWidth: '850px', height: '95vh', display: 'flex', flexDirection: 'column', gap: '10px', background: 'transparent', boxShadow: 'none' }}>
            
            {/* Action Bar (No Print) */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setActiveReportModal(null)} className="glass-btn" style={{ padding: '10px 20px', background: 'var(--glass-bg)', color: '#ef4444', fontWeight: 'bold', border: '1px solid var(--glass-border)' }}>Close</button>
              <button onClick={() => window.print()} className="glass-btn" style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', fontWeight: 'bold', border: 'none' }}><FontAwesomeIcon icon={faPrint} style={{marginRight: '8px'}} /> Print Report</button>
            </div>

            {/* The "Paper" Report */}
            <div className="report-paper" style={{
              background: '#ffffff',
              flex: 1,
              borderRadius: '4px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              padding: '40px',
              color: '#111827',
              fontFamily: 'Arial, sans-serif',
              fontSize: '14px',
              overflowY: 'auto',
              position: 'relative'
            }}>
              
              {/* Header */}
              <div style={{ borderBottom: '2px solid #e5e7eb', paddingBottom: '15px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#111827', letterSpacing: '-0.5px' }}>YAMES MINIMART</h1>
                  <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#6b7280' }}>123 Main Street, Accra • Tel: 020 123 4567</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#374151', textTransform: 'uppercase' }}>{reportData.title}</h2>
                  <div style={{ marginTop: '5px', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Period: {reportData.periodLabel}</div>
                </div>
              </div>

              {/* Content */}
              <div style={{ marginBottom: '50px' }}>
                
                {/* SUMMARY TYPE */}
                {reportData.type === 'summary' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: reportData.content.length > 2 ? 'repeat(3, 1fr)' : '1fr', gap: '15px' }}>
                      {reportData.content.map((item, idx) => (
                        <div key={idx} style={{ 
                          border: `1px solid ${item.highlight ? item.color : '#e5e7eb'}`, 
                          borderRadius: '6px', 
                          padding: '15px', 
                          background: item.highlight ? `${item.color}10` : '#f9fafb',
                        }}>
                          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#6b7280', marginBottom: '5px', fontWeight: 'bold' }}>{item.label}</div>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', color: item.color || '#111827' }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                    {/* Status Note */}
                    <div style={{ marginTop: '10px', padding: '10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', fontSize: '12px', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{fontWeight: 'bold'}}>STATUS:</span> This report has been generated successfully based on selected period.
                    </div>
                  </div>
                )}

                {/* TABLE TYPE */}
                {reportData.type === 'table' && (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #d1d5db' }}>
                        {reportData.headers.map((h, i) => (
                          <th key={i} style={{ padding: '10px', textAlign: 'left', fontWeight: 'bold', color: '#374151', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.rows.length > 0 ? reportData.rows.map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: i % 2 === 0 ? 'transparent' : '#f9fafb' }}>
                          {row.map((cell, idx) => (
                            <td key={idx} style={{ padding: '10px', color: '#4b5563' }}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={reportData.headers.length} style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontStyle: 'italic' }}>
                            No records found for this period.
                          </td>
                        </tr>
                      )}
                      {/* Total Row */}
                      {reportData.summary && (
                        <tr>
                          <td colSpan={reportData.headers.length - 1} style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#374151', borderTop: '2px solid #e5e7eb' }}>
                            TOTAL:
                          </td>
                          <td style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#111827', borderTop: '2px solid #e5e7eb', fontSize: '15px' }}>
                            {reportData.summary}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}

              </div>

              {/* Footer */}
              <div style={{ marginTop: 'auto', borderTop: '1px solid #e5e7eb', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                  <div>Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</div>
                  <div style={{ marginTop: '2px' }}>System ID: YAMES-POS-V1.0</div>
                </div>
                <div style={{ textAlign: 'center', width: '200px' }}>
                  <div style={{ marginBottom: '5px', fontSize: '12px', color: '#6b7280', fontWeight: 'bold' }}>Authorized Signature</div>
                  <div style={{ height: '1px', background: '#9ca3af', width: '100%' }}></div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}