import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../utils';

export default function Dashboard() {
  const [period, setPeriod] = useState('daily');
  
  const [stats, setStats] = useState({ total_sales: 0, total_orders: 0 });
  const [recentSales, setRecentSales] = useState([]);
  
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchItems, setBatchItems] = useState([]);

  const [lowStockData, setLowStockData] = useState([]);
  const [showStockModal, setShowStockModal] = useState(false);

  const [selectedSale, setSelectedSale] = useState(null);
  const [saleItems, setSaleItems] = useState([]);

  const [bestSeller, setBestSeller] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/dashboard/stats/' + period)
      .then(res => res.json())
      .then(data => setStats(data));
  }, [period]); 

  useEffect(() => {
    fetch('http://localhost:5000/api/dashboard/recent-sales')
      .then(res => res.json())
      .then(data => setRecentSales(data));
  }, []);

  useEffect(() => {
    fetch('http://localhost:5000/api/dashboard/best-seller')
      .then(res => res.json())
      .then(data => {
        if (data) {
          setBestSeller({
            name: data.name,
            total_sales: parseFloat(data.total_sales),
            total_revenue: parseFloat(data.total_revenue)
          });
        } else {
          setBestSeller(null);
        }
      });
  }, []);

  useEffect(() => {
    fetch('http://localhost:5000/api/dashboard/batches')
      .then(res => res.json())
      .then(data => setBatches(data));
  }, []);

  useEffect(() => {
    fetch('http://localhost:5000/api/dashboard/low-stock')
      .then(res => res.json())
      .then(data => setLowStockData(data));
  }, []);

  const handleViewReceipt = (sale) => {
    setSelectedSale(sale);
    fetch(`http://localhost:5000/api/sales/${sale.id}/items`)
      .then(res => res.json())
      .then(data => setSaleItems(data));
  };

  const handleViewBatch = (batch) => {
    setSelectedBatch(batch);
    fetch('http://localhost:5000/api/dashboard/batch-items/' + batch.inventory_id)
      .then(res => res.json())
      .then(data => setBatchItems(data));
  };

  const handleReprint = () => {
    window.print();
  };

  const outOfStock = lowStockData.filter(item => item.quantity === 0);
  const lowStock = lowStockData.filter(item => item.quantity > 0 && item.quantity < 11);

  const periodLabel = period.charAt(0).toUpperCase() + period.slice(1);

  return (
    <div style={{ 
      height: '100vh', 
      padding: '10px', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '10px',
      boxSizing: 'border-box',
      width: '100%' // Ensure full width
    }}>
      
      {/* CARD 1: HEADER (Stretched Full Width) */}
      <div className="glass-panel" style={{ 
        width: '100%', // STRETCH FULL WIDTH
        flexShrink: 0, 
        padding: '10px', 
        marginTop: '-20px', // Moved the card up by 20px
        marginLeft: '-10px', // Moved closer to the sidebar by 10px
        display: 'flex', 
        flexDirection: 'column', 
        gap: '5px'
      }}>
        
        {/* Top Row: Title and Dropdown */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{margin:0, fontSize:'28px'}}>Dashboard</h1>
          
          <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
            <span style={{fontSize:'14px', opacity:0.8}}>Summary:</span>
            <select 
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.3)',
                background: 'rgba(247, 246, 246, 0.1)',
                color: 'white',
                fontSize: '16px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="daily" style={{color:'black'}}>Daily</option>
              <option value="monthly" style={{color:'black'}}>Monthly</option>
              <option value="yearly" style={{color:'black'}}>Yearly</option>
            </select>
          </div>
        </div>

        {/* Metrics Row */}
        <div style={{ 
          display: 'flex', 
          gap: '20px',
          height: '120px' 
        }}>
          
          <div style={{ 
            flex: 1, 
            padding: 0, 
            background: 'rgba(96, 165, 250, 0.2)', 
            borderRadius: '16px', 
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <h3 style={{margin: '0 0 5px 0', fontSize: '20px', opacity: 0.8}}>{periodLabel} Sales</h3>
            <p style={{ fontSize: '20px', color: '#ebebeb', margin: 0, fontWeight:'bold', textAlign:'center' }}>
              {formatCurrency(stats.total_sales || 0)}
            </p>
          </div>

          <div style={{ 
            flex: 1, 
            padding: 0, 
            background: 'rgba(192, 132, 252, 0.2)', 
            borderRadius: '16px', 
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <h3 style={{margin: '0 0 5px 0', fontSize: '20px', opacity: 0.8}}>{periodLabel} Transaction Count</h3>
            <p style={{ fontSize: '24px', color: '#ff7b00', margin: 0, fontWeight:'bold' }}>
              {stats.total_orders || 0}
            </p>
          </div>

          <div style={{ 
            flex: 1, 
            padding: 0, 
            background: 'rgba(239, 68, 68, 0.1)', 
            borderRadius: '16px', 
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <h3 style={{color: '#fca5a5', margin: '0 0 5px 0', fontSize: '20px'}}>Stock Alerts</h3>
            <div style={{ fontSize: '15px', lineHeight: '1.2', marginBottom: '5px' }}>
              {outOfStock.length > 0 && <div style={{color: '#fca5a5'}}>Alert: {outOfStock.length} Out</div>}
              {lowStock.length > 0 && <div style={{color: '#fbbf24'}}>Alert: {lowStock.length} Low</div>}
              {(outOfStock.length === 0 && lowStock.length === 0) && <div style={{color: '#4ade80'}}>All Healthy</div>}
            </div>
            <button 
              onClick={() => setShowStockModal(true)}
              style={{
                background: 'rgba(255,255,255,0.2)', 
                border: 'none', 
                color: 'white', 
                padding: '4px 8px', 
                borderRadius: '4px', 
                cursor: 'pointer', 
                fontSize: '10px', 
                width: '80%'
              }}
            >
              View Details
            </button>
          </div>

          <div style={{ 
            flex: 1, 
            padding: 0, 
            background: 'rgba(16, 185, 129, 0.1)', 
            borderRadius: '16px', 
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <h3 style={{color: '#6ee7b7', margin: '0 0 5px 0', fontSize: '20px'}}>Best Selling</h3>
            <p style={{ fontSize: '20px', margin: 0, fontWeight: 'bold', opacity: 0.9 }}>
              {bestSeller && bestSeller.name 
                ? bestSeller.name 
                : "No best-selling item available"}
            </p>
            <div style={{ fontSize: '13px', opacity: 0.8, marginTop: '2px' }}>
              Sales: <span style={{fontWeight: 'bold', color: '#6ee7b7'}}>
                {bestSeller && bestSeller.total_sales 
                  ? formatCurrency(bestSeller.total_sales) 
                  : "N/A"}
              </span>
              {' | '}
              Revenue: <span style={{fontWeight: 'bold', color: '#6ee7b7'}}>
                {bestSeller && bestSeller.total_revenue 
                  ? formatCurrency(bestSeller.total_revenue) 
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* CARD 2: SCROLLABLE CONTAINER (Stretched Full Width) */}
      <div className="glass-panel" style={{ 
        flex: 1, 
        width: '100%', /* STRETCH FULL WIDTH */
        padding: '10px', 
        marginLeft: '-10px', // Moved closer to the sidebar by 10px
        overflowY: 'auto', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '10px' 
      }}>
        
        {/* Sub-Card: Sales History (Stretched) */}
        <div style={{ 
          width: '100%', /* STRETCH */
          padding: '20px', 
          background: 'rgba(255,255,255,0.05)', 
          borderRadius: '16px', 
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <h2 style={{marginTop:0, marginBottom:'15px'}}>Recent Sales History</h2>
          <div style={{overflowX: 'auto'}}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.3)' }}>
                  <th style={{padding:'10px'}}>Invoice ID</th>
                  <th>Date</th>
                  <th>Total Amount</th>
                  <th>Revenue</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map(sale => (
                  <tr key={sale.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <td style={{padding:'10px', fontFamily:'monospace'}}>{sale.invoice_id}</td>
                    <td>{new Date(sale.sale_time).toLocaleString()}</td>
                    <td>{formatCurrency(sale.total_amount)}</td>
                    <td style={{color: '#4ade80', fontWeight: 'bold'}}>{formatCurrency(sale.total_revenue)}</td>
                    <td>
                      <button className="glass-btn" style={{padding:'5px 10px', fontSize:'12px'}} onClick={() => handleViewReceipt(sale)}>
                        View Receipt
                      </button>
                    </td>
                  </tr>
                ))}
                {recentSales.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '10px', color: 'rgba(255,255,255,0.6)' }}>
                      No recent sales to display.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sub-Card: Batches (Stretched) */}
        <div style={{ 
          width: '100%', /* STRETCH */
          padding: '20px', 
          background: 'rgba(255,255,255,0.05)', 
          borderRadius: '16px', 
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <h2 style={{marginTop:0, marginBottom:'15px'}}>Inventory History (Batches)</h2>
          <div style={{overflowX: 'auto'}}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.3)' }}>
                  <th style={{padding:'10px'}}>Batch ID</th>
                  <th>Date Added</th>
                  <th>Item Count</th>
                  <th>Total Value</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {batches.map(batch => (
                  <tr key={batch.inventory_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <td style={{padding:'10px', fontFamily:'monospace'}}>{batch.inventory_id}</td>
                    <td>{new Date(batch.date_added).toLocaleString()}</td>
                    <td>{batch.item_count}</td>
                    <td>{formatCurrency(batch.total_value)}</td>
                    <td>
                      <button 
                        className="glass-btn" 
                        style={{padding:'5px 10px', fontSize:'12px'}} 
                        onClick={() => handleViewBatch(batch)}
                      >
                        View Items
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* MODALS */}
      {selectedBatch && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="glass-panel" style={{ padding: '20px', width: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{marginTop:0}}>Batch Details: {selectedBatch.inventory_id}</h3>
            <p style={{fontSize:'12px', opacity:0.7}}>{new Date(selectedBatch.date_added).toLocaleString()}</p>
            
            <div style={{overflowY: 'auto', margin: '20px 0', border: '1px solid rgba(255,255,255,0.2)'}}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <th style={{padding:'8px'}}>Name</th>
                    <th style={{padding:'8px'}}>Barcode</th>
                    <th style={{padding:'8px'}}>Price</th>
                    <th style={{padding:'8px'}}>Qty</th>
                    <th style={{padding:'8px'}}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {batchItems.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <td style={{padding:'8px'}}>{item.name}</td>
                      <td style={{padding:'8px'}}>{item.barcode}</td>
                      <td style={{padding:'8px'}}>{formatCurrency(item.price)}</td>
                      <td style={{padding:'8px'}}>{item.quantity}</td>
                      <td style={{padding:'8px'}}>{formatCurrency(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button 
              className="glass-btn" 
              style={{alignSelf: 'flex-end', background: 'rgba(255,0,0,0.2)', borderColor:'rgba(255,0,0,0.4)'}}
              onClick={() => { setSelectedBatch(null); setBatchItems([]); }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showStockModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="glass-panel" style={{ padding: '20px', width: '700px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{marginTop:0, color: '#fca5a5'}}>Restock Report</h3>
            
            <div style={{overflowY: 'auto', margin: '20px 0' }}>
              
              {outOfStock.length > 0 && (
                <div style={{marginBottom:'20px'}}>
                  <h4 style={{color:'#ef4444', margin:'0 0 10px 0'}}>CRITICAL: Out of Stock</h4>
                  <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', background: 'rgba(239, 68, 68, 0.1)' }}>
                    <thead>
                      <tr>
                        <th style={{padding:'8px'}}>Item Name</th>
                        <th style={{padding:'8px', textAlign:'center'}}>Current Qty</th>
                        <th style={{padding:'8px', textAlign:'center'}}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {outOfStock.map(item => (
                        <tr key={item.name} style={{borderBottom: '1px solid rgba(239,68,68,0.2)'}}>
                          <td style={{padding:'8px'}}>{item.name}</td>
                          <td style={{padding:'8px', textAlign:'center', fontWeight:'bold', color:'#ef4444'}}>{item.quantity}</td>
                          <td style={{padding:'8px', textAlign:'center', color:'#ef4444'}}>EMPTY</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {lowStock.length > 0 && (
                <div style={{marginBottom:'20px'}}>
                  <h4 style={{color:'#fbbf24', margin:'0 0 10px 0'}}>WARNING: Low Stock</h4>
                  <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', background: 'rgba(251, 191, 36, 0.1)' }}>
                    <thead>
                      <tr>
                        <th style={{padding:'8px'}}>Item Name</th>
                        <th style={{padding:'8px', textAlign:'center'}}>Current Qty</th>
                        <th style={{padding:'8px', textAlign:'center'}}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStock.map(item => (
                        <tr key={item.name} style={{borderBottom: '1px solid rgba(251,191,36,0.2)'}}>
                          <td style={{padding:'8px'}}>{item.name}</td>
                          <td style={{padding:'8px', textAlign:'center', fontWeight:'bold', color:'#fbbf24'}}>{item.quantity}</td>
                          <td style={{padding:'8px', textAlign:'center', color:'#fbbf24'}}>LOW</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {(outOfStock.length === 0 && lowStock.length === 0) && (
                <div style={{textAlign:'center', padding:'40px', color:'#4ade80'}}>
                  <h3>All Systems Green!</h3>
                  <p>No items require restocking at this time.</p>
                </div>
              )}

            </div>

            <button 
              className="glass-btn" 
              style={{alignSelf: 'flex-end', background: 'rgba(255,255,255,0.2)', borderColor:'rgba(255,255,255,0.4)'}}
              onClick={() => setShowStockModal(false)}
            >
              Close Report
            </button>
          </div>
        </div>
      )}

      {selectedSale && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{ 
            width: '380px', 
            maxHeight: '90vh', 
            display: 'flex', 
            flexDirection: 'column',
            boxShadow: '0 0 20px rgba(0,0,0,0.5)'
          }}>
            <div className="receipt-printable" style={{
              background: 'white', 
              color: 'black', 
              padding: '20px', 
              fontFamily: 'monospace',
              flex: 1, 
              overflowY: 'auto',
              borderBottom: '1px solid #ddd'
            }}>
              <h3 style={{textAlign: 'center', margin: '0 0 10px 0', textTransform: 'uppercase'}}>Minimart Store</h3>
              <div style={{fontSize: '12px', marginBottom: '10px', textAlign: 'center', color: '#555'}}>
                123 Tech Street, Accra<br/>
                Tel: 020 000 0000
              </div>
              
              <hr style={{borderTop: '1px dashed black', margin: '10px 0'}} />
              
              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px'}}>
                <span>Inv ID:</span>
                <span>{selectedSale.invoice_id}</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '15px'}}>
                <span>Date:</span>
                <span>{new Date(selectedSale.sale_time).toLocaleString()}</span>
              </div>

              <hr style={{borderTop: '1px dashed black', margin: '10px 0'}} />

              <table style={{width: '100%', fontSize: '13px', borderCollapse: 'collapse', marginBottom: '10px'}}>
                <thead>
                  <tr>
                    <th style={{textAlign: 'left'}}>Item</th>
                    <th style={{textAlign: 'center'}}>Qty</th>
                    <th style={{textAlign: 'right'}}>Revenue</th>
                    <th style={{textAlign: 'right'}}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {saleItems.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{padding: '2px 0'}}>
                        {item.name}
                        {bestSeller && item.name === bestSeller.name && (
                          <span style={{
                            marginLeft: '5px', 
                            fontSize: '9px', 
                            background: '#4ade80', 
                            color: 'black', 
                            padding: '1px 4px', 
                            borderRadius: '3px',
                            fontWeight: 'bold'
                          }}>
                            BEST SELLER
                          </span>
                        )}
                      </td>
                      <td style={{textAlign: 'center'}}>{item.qty}</td>
                      <td style={{textAlign: 'right'}}>
                        {formatCurrency((item.price_at_sale - item.cost) * item.qty)}
                      </td>
                      <td style={{textAlign: 'right'}}>{formatCurrency(item.price_at_sale * item.qty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <hr style={{borderTop: '1px dashed black', margin: '10px 0'}} />

              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold'}}>
                <span>TOTAL</span>
                <span>{formatCurrency(selectedSale.total_amount)}</span>
              </div>
              
              <div style={{marginTop: '20px', fontSize: '11px', textAlign: 'center', color: '#555'}}>
                Thank you for shopping with us!<br/>
                No Refund / No Exchange after 24hrs.
              </div>
            </div>

            <div className="payment-actions" style={{ background: '#f3f4f6', padding: '15px', display: 'flex', gap: '10px' }}>
              <button 
                onClick={handleReprint}
                style={{ 
                  background: '#3b82f6', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', 
                  fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', flex: 1
                }}
              >
                🖨️ Reprint
              </button>
              <button 
                onClick={() => { setSelectedSale(null); setSaleItems([]); }}
                style={{ 
                  background: '#ef4444', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', 
                  cursor: 'pointer', fontSize: '14px', flex: 1
                }}
              >
                ✖ Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}