import { useState, useEffect } from 'react';
import { formatCurrency, formatDateTime, formatTime, formatDate } from '../utils';

export default function Dashboard({ theme, showToast }) {
  const [stats, setStats] = useState({ total_sales: 0, total_orders: 0 });
  const [period, setPeriod] = useState('daily');
  const [lowStock, setLowStock] = useState([]);
  const [bestSeller, setBestSeller] = useState(null);
  const [batches, setBatches] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [viewTransaction, setViewTransaction] = useState(null); 
  const [viewItems, setViewItems] = useState([]); 
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchItems, setBatchItems] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [companyDetails, setCompanyDetails] = useState({
    name: 'YAMES MINIMART',
    address: '123 Main Street, Accra',
    location: 'Opposite Main Market',
    phone: '020 123 4567',
    footer: 'THANK YOU FOR SHOPPING WITH US!!'
  });

  const fetchStats = () => {
    fetch(`http://localhost:5000/api/dashboard/stats/${period}`)
      .then(res => res.json())
      .then(setStats)
      .catch(console.error);
  };

  const fetchDetails = () => {
    fetch('http://localhost:5000/api/dashboard/low-stock')
      .then(res => res.json())
      .then(setLowStock);
    fetch('http://localhost:5000/api/dashboard/best-seller')
      .then(res => res.json())
      .then(setBestSeller);
  };

  const fetchBatches = () => {
    fetch('http://localhost:5000/api/batches')
      .then(res => res.json())
      .then(setBatches)
      .catch(console.error);
  };

  const fetchTransactions = () => {
    fetch('http://localhost:5000/api/sales/all')
      .then(res => res.json())
      .then(data => {
        setTransactions(data);
      })
      .catch(err => console.error("Failed to fetch transactions:", err));
  };

  useEffect(() => {
    const savedSettings = localStorage.getItem('minimart_settings');
    if (savedSettings) setCompanyDetails(JSON.parse(savedSettings));
    fetchStats(); 
    fetchDetails(); 
    fetchTransactions(); 
    fetchBatches();
  }, [period]);

  const handleViewBatch = (batchId) => {
    setSelectedBatchId(batchId);
    fetch(`http://localhost:5000/api/batch-items/${batchId}`)
      .then(res => res.json())
      .then(data => {
        setBatchItems(data);
        setShowBatchModal(true);
      })
      .catch(err => {
        console.error("Fetch error:", err);
        showToast("Error loading batch items");
      });
  };

  const handleViewTransaction = async (sale) => {
    try {
      const res = await fetch(`http://localhost:5000/api/sales/${sale.id}/items`);
      const items = await res.json();
      setViewTransaction(sale);
      setViewItems(items);
    } catch (err) {
      console.error("Failed to fetch transaction details", err);
      showToast("Could not load transaction details.");
    }
  };

  const closeViewModal = () => {
    setViewTransaction(null);
    setViewItems([]);
  };

  const handlePrint = () => window.print();

  // Theme Color Helper
  const textColor = 'var(--text-color)';
  const labelColor = 'var(--text-color)';
  const buttonTextColor = 'var(--text-color)';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '20px', overflow: 'hidden' }}>
      <div className="glass-panel" style={{ padding: '20px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px' }}>
          <h2 style={{ margin: 0, color: textColor, fontSize: '24px', fontWeight: 'bold' }}>Dashboard Overview</h2>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {['daily', 'monthly', 'yearly'].map(p => (
              <button 
                key={p} 
                className="glass-btn" 
                onClick={() => setPeriod(p)} 
                style={{ 
                  textTransform: 'capitalize', 
                  color: buttonTextColor,
                  background: period === p ? 'var(--glass-btn-hover-bg)' : 'var(--glass-btn-bg)'
                }}
              >
                {p}
              </button>
            ))}
            <button 
              className="glass-btn"
              onClick={() => setShowLowStockModal(true)}
              disabled={lowStock.length === 0}
              style={{
                textTransform: 'uppercase',
                fontWeight: 'bold',
                background: lowStock.length === 0 ? 'var(--success-bg)' : 'var(--warning-bg)',
                color: lowStock.length === 0 ? 'var(--success)' : 'var(--warning)',
                borderColor: lowStock.length === 0 ? 'var(--success)' : 'var(--warning)',
                cursor: lowStock.length === 0 ? 'default' : 'pointer',
                opacity: lowStock.length === 0 ? 0.8 : 1
              }}
            >
              {lowStock.length === 0 ? '✅ Stock OK' : '⚠️ Low Stock'}
            </button>
          </div>
        </div>
        {lowStock.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '10px', background: 'var(--warning-bg)', borderRadius: '8px', overflowX: 'auto', border: '1px solid var(--warning)' }}>
            <span style={{ fontWeight: 'bold', color: 'var(--warning)', whiteSpace: 'nowrap' }}>⚠️ Low Stock:</span>
            <div style={{ display: 'flex', gap: '10px' }}>
              {lowStock.map(p => (
                <div key={p.name} style={{ background: 'var(--glass-btn-bg)', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', whiteSpace: 'nowrap' }}>
                  {p.name}: <span style={{ fontWeight: 'bold', color: 'var(--warning)' }}>{p.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="glass-panel" style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', minHeight: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', flexShrink: 0 }}>
          <div className="glass-panel" style={{padding:'15px', background:'var(--success-bg)', display:'flex', flexDirection:'column', justifyContent:'center'}}>
            <h3 style={{margin:'0 0 10px 0', opacity:0.8, color: textColor, fontSize: '14px'}}>Total Sales ({period})</h3>
            <p style={{fontSize:'28px', fontWeight:'bold', margin:0, color: textColor}}>{formatCurrency(stats.total_sales)}</p>
          </div>
          <div className="glass-panel" style={{padding:'15px', background:'var(--info-bg)', display:'flex', flexDirection:'column', justifyContent:'center'}}>
            <h3 style={{margin:'0 0 10px 0', opacity:0.8, color: textColor, fontSize: '14px'}}>Total Orders</h3>
            <p style={{fontSize:'28px', fontWeight:'bold', margin:0, color: textColor}}>{stats.total_orders}</p>
          </div>
          <div className="glass-panel" style={{padding:'15px', background:'var(--warning-bg)', display:'flex', flexDirection:'column', justifyContent:'center'}}>
            <h3 style={{margin:'0 0 10px 0', opacity:0.8, color: textColor, fontSize: '14px'}}>Best Seller</h3>
            <p style={{fontSize:'18px', fontWeight:'bold', margin:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', color: textColor}}>
              {bestSeller ? bestSeller.name : 'No data'}
            </p>
            {bestSeller && <small style={{ color: labelColor }}>{bestSeller.total_sold} sold</small>}
          </div>
        </div>

        {/* BATCH HISTORY TABLE */}
        <div className="glass-panel" style={{ padding: '15px' }}>
          <h3 style={{margin:'0 0 15px 0', color: textColor, fontSize: '18px'}}>Batch History</h3>
          <table className="data-view-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead style={{position: 'sticky', top: 0, background: 'var(--table-header-bg)', zIndex: 10}}>
              <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <th style={{padding: '10px', color: labelColor}}>Date</th>
                <th style={{padding: '10px', color: labelColor}}>Batch ID</th>
                <th style={{padding: '10px', color: labelColor}}>Total Price</th>
                <th style={{padding: '10px', color: labelColor}}>Total Cost</th>
                <th style={{padding: '10px', color: labelColor}}>Action</th>
              </tr>
            </thead>
            <tbody>
              {batches.length === 0 && <tr><td colSpan="5" style={{textAlign:'center', opacity:0.6, padding:'20px'}}>No batches found.</td></tr>}
              {batches.map(b => (
                <tr key={b.batch_id} style={{ borderBottom: '1px solid var(--table-border)' }}>
                  <td style={{padding: '10px', color: textColor}}>{formatDate(b.date)}</td>
                  <td style={{padding: '10px', fontFamily: 'monospace', color: textColor}}>{b.batch_id}</td>
                  <td style={{padding: '10px', color: textColor}}>{formatCurrency(b.total_price)}</td>
                  <td style={{padding: '10px', color: textColor}}>{formatCurrency(b.total_cost)}</td>
                  <td style={{padding: '10px'}}>
                    <button className="glass-btn" style={{padding:'4px 10px', fontSize:'12px'}} onClick={() => handleViewBatch(b.batch_id)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TRANSACTION HISTORY TABLE */}
        <div className="glass-panel" style={{ padding: '15px' }}>
          <h3 style={{margin:'0 0 15px 0', color: textColor, fontSize: '18px'}}>Transaction History</h3>
          <table className="data-view-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead style={{position: 'sticky', top: 0, background: 'var(--table-header-bg)', zIndex: 10}}>
              <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <th style={{padding: '10px', color: labelColor}}>Date</th>
                <th style={{padding: '10px', color: labelColor}}>Trans ID</th>
                <th style={{padding: '10px', color: labelColor}}>Total</th>
                <th style={{padding: '10px', color: labelColor}}>Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 && <tr><td colSpan="4" style={{textAlign:'center', opacity:0.6, padding:'20px'}}>No transactions found.</td></tr>}
              {transactions.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--table-border)' }}>
                  <td style={{padding: '10px', color: textColor}}>{formatDateTime(s.sale_time)}</td>
                  <td style={{padding: '10px', fontFamily: 'monospace', color: textColor}}>{s.transaction_id}</td>
                  <td style={{padding: '10px', color: textColor}}>{formatCurrency(s.total_amount)}</td>
                  <td style={{padding: '10px'}}>
                    <button className="glass-btn" style={{padding:'4px 10px', fontSize:'12px'}} onClick={() => handleViewTransaction(s)}>View / Reprint</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- BATCH ITEMS MODAL --- */}
      {showBatchModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--modal-overlay)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div className="glass-panel" style={{ padding: '30px', width: '800px', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{marginTop:0, marginBottom:0, color: textColor, fontSize: '20px'}}>Items in Batch: <span style={{fontFamily: 'monospace'}}>{selectedBatchId}</span></h3>
              <button className="glass-btn" onClick={() => setShowBatchModal(false)} style={{color: buttonTextColor}}>✕ Close</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <table className="data-view-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--table-header-bg)', zIndex: 10 }}>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <th style={{padding: '10px', color: textColor}}>Product Name</th>
                    <th style={{padding: '10px', color: textColor}}>Barcode</th>
                    <th style={{padding: '10px', color: textColor}}>Cost</th>
                    <th style={{padding: '10px', color: textColor}}>Price</th>
                    <th style={{padding: '10px', color: textColor}}>Qty Received</th>
                  </tr>
                </thead>
                <tbody>
                  {batchItems.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--table-border)' }}>
                      <td style={{padding: '10px', color: textColor}}>{item.name}</td>
                      <td style={{padding: '10px', fontFamily: 'monospace', color: textColor}}>{item.barcode}</td>
                      <td style={{padding: '10px', color: textColor}}>{formatCurrency(item.cost)}</td>
                      <td style={{padding: '10px', color: textColor}}>{formatCurrency(item.price)}</td>
                      <td style={{padding: '10px', color: textColor}}>{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- LOW STOCK DETAIL MODAL --- */}
      {showLowStockModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--modal-overlay)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
          <div className="glass-panel" style={{ padding: '30px', width: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--warning)', paddingBottom: '15px' }}>
              <h3 style={{marginTop:0, marginBottom:0, color: 'var(--warning)'}}>⚠️ Items Requiring Restock</h3>
              <button className="glass-btn" onClick={() => setShowLowStockModal(false)} style={{color: buttonTextColor}}>✕ Close</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {lowStock.length === 0 && <div style={{textAlign:'center', opacity:0.6, color: textColor}}>No low stock items found.</div>}
              <table className="data-view-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--table-header-bg)', zIndex: 10 }}>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <th style={{padding: '10px', color: textColor}}>Product Name</th>
                    <th style={{padding: '10px', color: textColor}}>Current Quantity</th>
                    <th style={{padding: '10px', color: textColor}}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map(p => (
                    <tr key={p.name} style={{ borderBottom: '1px solid var(--table-border)' }}>
                      <td style={{padding: '10px', color: textColor}}>{p.name}</td>
                      <td style={{padding: '10px', color: 'var(--warning)', fontFamily:'monospace'}}>{p.quantity}</td>
                      <td style={{padding: '10px', color: 'var(--danger)', fontWeight:'bold'}}>LOW</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TRANSACTION DETAIL / REPRINT MODAL --- */}
      {viewTransaction && (
        <div className="receipt-printable" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'var(--modal-overlay)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', color: 'black', width: '320px', padding: '20px', boxShadow: '0 0 20px rgba(0,0,0,0.5)', fontFamily: 'monospace' }}>
            <div style={{textAlign:'center', marginBottom:'15px', borderBottom:'1px dashed #000', paddingBottom:'10px'}}>
              <h2 style={{margin:0, fontSize:'18px', textTransform:'uppercase'}}>{companyDetails.name}</h2>
              <p style={{margin:'2px 0', fontSize:'12px'}}>{companyDetails.address}</p>
              <p style={{margin:'2px 0', fontSize:'12px'}}>{companyDetails.location}</p>
              <p style={{margin:'2px 0', fontSize:'12px'}}>{companyDetails.phone}</p>
            </div>
            <div style={{marginBottom:'10px', fontSize:'12px'}}>
              <p style={{margin:'2px 0'}}><strong>Date:</strong> {formatDate(viewTransaction.sale_time)} {formatTime(viewTransaction.sale_time)}</p>
              <p style={{margin:'2px 0'}}><strong>Trans ID:</strong> {viewTransaction.transaction_id}</p>
              <p style={{margin:'2px 0'}}><strong>Method:</strong> CASH (REPRINT)</p>
            </div>
            <div style={{marginBottom:'15px', borderBottom:'1px dashed #000', paddingBottom:'15px'}}>
              {viewItems.map(item => (
                <div key={item.id} style={{display: 'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                  <span>{item.name} x{item.qty}</span>
                  <span>{formatCurrency(item.price_at_sale * item.qty).replace('GHS ', '')}</span>
                </div>
              ))}
            </div>
            <div style={{borderTop:'1px dashed #000', paddingTop:'10px', display:'flex', justifyContent:'space-between', fontSize:'18px', fontWeight:'bold', marginBottom:'20px'}}>
              <span>TOTAL</span>
              <span>{formatCurrency(viewTransaction.total_amount).replace('GHS ', '')}</span>
            </div>
            <div style={{textAlign:'center', marginTop:'10px', fontSize:'14px'}}>
              <p style={{margin:0, fontStyle:'italic'}}>{companyDetails.footer}</p>
            </div>
            <div className="payment-actions" style={{marginTop:'30px', display: 'flex', flexDirection: 'column', gap: '10px'}}>
              <button onClick={handlePrint} style={{padding:'10px', fontSize:'16px', cursor:'pointer'}}>Print Receipt</button>
              <button onClick={closeViewModal} style={{padding:'10px', fontSize:'16px', cursor:'pointer', background:'#eee', border:'none', borderRadius:'4px'}}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}