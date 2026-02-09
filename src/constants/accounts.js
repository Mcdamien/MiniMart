// src/constants/accounts.js

export const ACCOUNT_HIERARCHY = [
  {
    id: 'INCOME',
    type: 'INCOME',
    name: 'Income',
    children: [
      { id: '4010', name: 'Product Sales (Cash/Card/MoMo)' }
    ]
  },
  {
    id: 'EXPENSE',
    type: 'EXPENSE',
    name: 'Expenses',
    children: [
      // COGS
      { id: '5010', name: 'Product Purchase Cost' },
      { id: '5020', name: 'Transport / Shipping Cost' },
      { id: '5030', name: 'Packaging Expense' },
      { id: '5040', name: 'Stock Adjustment Loss' },
      
      // Operating Expenses
      { id: '6110', name: 'Salaries & Wages' },
      { id: '6120', name: 'Staff Incentives' },
      { id: '6130', name: 'Payroll Taxes' },
      { id: '6140', name: 'Staff Welfare' },
      { id: '6210', name: 'Shop Rent' },
      { id: '6220', name: 'Electricity' },
      { id: '6230', name: 'Water' },
      { id: '6240', name: 'Internet / Phone' },
      { id: '6250', name: 'Security Charges' },
      { id: '6310', name: 'Advertising' },
      { id: '6320', name: 'Online Marketing' },
      { id: '6330', name: 'Promotional Discounts' },

      // Administrative
      { id: '7010', name: 'Software Expense (POS/Accounting)' },
      { id: '7020', name: 'Office Supplies' },
      { id: '7030', name: 'Bank Charges' },

      // Financial
      { id: '8010', name: 'Loan Interest' },
      { id: '8020', name: 'Credit Card Processing Fees' },

      // Losses
      { id: '9010', name: 'Stock Damage / Expiry Loss' },
      { id: '9020', name: 'Theft' },
      { id: '9030', name: 'Inventory Revaluation Loss' }
    ]
  },
  {
    id: 'LOSS',
    type: 'LOSS',
    name: 'Losses',
    children: [
      // Included as separate if needed, but also under Expenses above
      { id: '9010', name: 'Stock Damage / Expiry' },
      { id: '9020', name: 'Theft' }
    ]
  }
];