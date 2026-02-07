// src/utils.js
export const formatCurrency = (amount) => {
  // 1. Convert to number and fix to 2 decimals
  const fixedAmount = Number(amount).toFixed(2);
  
  // 2. Add commas using Regex (matches every 3 digits from the right)
  const withCommas = fixedAmount.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  
  // 3. Return with GHS prefix
  return "GHS " + withCommas;
};

export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = String(date.getFullYear()).slice(-2);
  return `${d}/${m}/${y}`;
};

export const formatTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${min}`;
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  return `${formatDate(dateString)} ${formatTime(dateString)}`;
};