import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../utils'; 

export default function POSTerminal() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processedSale, setProcessedSale] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/api/products')
      .then(res => res.json())
      .then(data => setProducts(data));
  }, []);

  const filteredProducts = products.filter(product => {
    const term = searchTerm.toLowerCase();
    const nameMatch = product.name.toLowerCase().includes(term);
    const barcodeMatch = String(product.barcode).toLowerCase().includes(term);
    return nameMatch || barcodeMatch;
  });

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...existing, qty: existing.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const handleCheckoutClick = () => {
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }
    setProcessedSale(null);
    setShowPaymentModal(true);
  };

  const getTotal = () => {
    return cart.reduce((a, b) => a + (b.price * b.qty), 0);
  };

  const clearCart = () => {
    if (window.confirm("Are you sure you want to clear the entire cart?")) {
      setCart([]);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);

    const exactMatch = products.find(p => p.barcode === val);
    if (exactMatch) {
      addToCart(exactMatch);
      setSearchTerm(''); 
    }
  };

  const handlePayment = async (method) => {
    try {
      const response = await fetch('http://localhost:5000/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart })
      });
      const data = await response.json();

      console.log("Processed sale data:", data);
      console.log("Cart state before clearing:", cart);
      console.log("Payment modal visibility:", showPaymentModal);
      console.log("Products state before update:", products);

      if (data.success) {
        setProcessedSale(data);

        if (method === 'CASH') {
          console.log("🔌 SIGNAL: Open Cash Drawer (Command Sent)");
        }

        try {
          setTimeout(() => {
            window.print();
            console.log("🖨️ Print command executed successfully.");
          }, 500);
        } catch (printError) {
          console.error("Error during print operation:", printError);
          alert("An error occurred while printing.");
        }

        setTimeout(() => {
          setCart([]);
          setShowPaymentModal(false);
          setProcessedSale(null);

          fetch('http://localhost:5000/api/products')
            .then(res => {
              if (!res.ok) {
                throw new Error(`Failed to fetch products: ${res.statusText}`);
              }
              return res.json();
            })
            .then(data => setProducts(data))
            .catch(fetchError => {
              console.error("Error fetching updated products:", fetchError);
              alert("Failed to update product list.");
            });
        }, 1000);

      } else {
        alert("Sale failed: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during payment.");
    }
  };

  const closeModal = () => {
    setShowPaymentModal(false);
  };

  return (
    <div style={{ display: 'flex', gap: '20px', height: '100%' }}>
      
      <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
        
        <div className="glass-panel" style={{ 
          padding: '15px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '15px', 
          background: 'rgba(0,0,0,0.2)' 
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>PRODUCTS</h2>
          <input 
            type="text" 
            className="glass-input" 
            placeholder="Search by Name or Barcode..." 
            value={searchTerm}
            onChange={handleSearchChange} 
            style={{ fontSize: '16px', padding: '12px', flex: 1, margin: 0 }}
          />
        </div>

        <div className="glass-panel" style={{ flex: 1, padding: '15px', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '15px' }}>
            {filteredProducts.map(p => (
              <div key={p.id} className="glass-panel" style={{ padding: '15px', cursor: 'pointer', textAlign: 'center' }} 
                   onClick={() => addToCart(p)}>
                <div style={{fontSize:'16px', fontWeight:'bold', marginBottom: '5px'}}>{p.name}</div>
                <div style={{color:'#4ade80', fontSize: '18px', fontWeight: 'bold'}}>{formatCurrency(p.price)}</div>
                <small style={{color: 'rgba(255,255,255,0.7)', display: 'block', marginTop: '5px'}}>
                  Stock: {p.quantity}
                </small>
              </div>
            ))}
            {filteredProducts.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px', opacity: 0.6 }}>
                No products found matching "{searchTerm}"
              </div>
            )}
          </div>
        </div>

      </div>

      <div className="glass-panel" style={{ flex: 1, padding: '15px', display: 'flex', flexDirection: 'column' }}>
        <h2>Current Sale</h2>
        <div style={{ flex: 1, overflowY: 'auto', margin: '10px 0' }}>
          {cart.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom:'5px' }}>
              <span>{item.name} x{item.qty}</span>
              <span>{formatCurrency(item.price * item.qty)}</span>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: '15px' }}>
          <h3>Total: {formatCurrency(getTotal())}</h3>
          
          <button 
            onClick={clearCart}
            style={{
              width: '100%',
              marginTop: '10px',
              backgroundColor: 'rgba(234, 179, 8, 0.3)',
              border: '1px solid rgba(234, 179, 8, 0.6)',
              color: '#fef08a',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(234, 179, 8, 0.5)'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(234, 179, 8, 0.3)'}
          >
            🗑️ Clear Cart
          </button>

          <button className="glass-btn" style={{ width: '100%', marginTop: '10px', backgroundColor: 'rgba(0,255,0,0.2)', borderColor:'rgba(0,255,0,0.4)' }} onClick={handleCheckoutClick}>
            CHECKOUT (PREVIEW)
          </button>
        </div>
      </div>

      {/* --- PAYMENT MODAL --- */}
      {showPaymentModal && (
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
            
            <div id="printable-receipt" className="receipt-printable" style={{
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
                <span>{processedSale ? processedSale.invoice_id : "PENDING..."}</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '15px'}}>
                <span>Date:</span>
                <span>{processedSale ? new Date(processedSale.sale_time).toLocaleString() : new Date().toLocaleString()}</span>
              </div>

              <hr style={{borderTop: '1px dashed black', margin: '10px 0'}} />

              <table style={{width: '100%', fontSize: '13px', borderCollapse: 'collapse', marginBottom: '10px'}}>
                <thead>
                  <tr>
                    <th style={{textAlign: 'left'}}>Item</th>
                    <th style={{textAlign: 'center'}}>Qty</th>
                    <th style={{textAlign: 'right'}}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{padding: '2px 0'}}>{item.name}</td>
                      <td style={{textAlign: 'center'}}>{item.qty}</td>
                      <td style={{textAlign: 'right'}}>{formatCurrency(item.price * item.qty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <hr style={{borderTop: '1px dashed black', margin: '10px 0'}} />

              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold'}}>
                <span>TOTAL</span>
                <span>{formatCurrency(getTotal())}</span>
              </div>
              
              <div style={{marginTop: '20px', fontSize: '11px', textAlign: 'center', color: '#555'}}>
                Thank you for shopping with us!<br/>
                No Refund / No Exchange after 24hrs.
              </div>
            </div>

            {/* --- UPDATED BUTTONS --- */}
            <div className="payment-buttons-container payment-actions" style={{ background: '#f3f4f6', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              
              {/* Row 1: Cash and MoMo Side-by-Side */}
              <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                <button 
                  onClick={() => handlePayment('CASH')}
                  style={{ 
                    background: '#22c55e', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', 
                    fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', flex: 1
                  }}
                >
                  💵 Cash
                </button>
                
                <button 
                  onClick={() => handlePayment('MOMO')}
                  style={{ 
                    background: '#3b82f6', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', 
                    fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', flex: 1
                  }}
                >
                   📱 MoMo
                </button>
              </div>

              {/* Row 2: Cancel Underneath */}
              <button 
                onClick={closeModal}
                style={{ 
                  background: '#ef4444', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', 
                  cursor: 'pointer', fontSize: '14px', width: '100%'
                }}
              >
                ✖ Cancel
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}