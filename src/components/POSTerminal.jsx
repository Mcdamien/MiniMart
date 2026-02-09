import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { formatCurrency, formatDate, formatTime } from '../utils';

export default function POSTerminal({ showToast }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');  
  const [currentSale, setCurrentSale] = useState(null);
  const [showCheckoutPreview, setShowCheckoutPreview] = useState(false);
  const inputRefs = useRef({});
  const lastFocusedId = useRef(null);
  const inputRef = useRef(null);

  // State for Company Details & Tax Config
  const [companyDetails, setCompanyDetails] = useState({});
  const [taxConfig, setTaxConfig] = useState({ enabled: false, rate: 0 });

  // Helper: FETCH PRODUCTS
  const fetchProducts = () => {
    fetch('http://localhost:5000/api/products')
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error('Failed to fetch products', err));
  };

  useEffect(() => {
    fetchProducts();
    if(inputRef.current) inputRef.current.focus();
    const savedSettings = localStorage.getItem('minimart_settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setCompanyDetails(parsed);
      if (parsed.taxConfig) {
        setTaxConfig(parsed.taxConfig);
      }
    }
  }, []);

  // Helper: ADD TO CART
  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.qty < product.quantity) {
          lastFocusedId.current = existing.id;
          setTimeout(() => {
            if (inputRefs.current[existing.id]) {
              inputRefs.current[existing.id].select();
              inputRefs.current[existing.id].focus();
            }
          }, 0);
          return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
        } else {
          showToast("Not enough stock!");
          return prev;
        }
      }
      lastFocusedId.current = product.id;
      setTimeout(() => {
        if (inputRefs.current[product.id]) {
          inputRefs.current[product.id].select();
          inputRefs.current[product.id].focus();
        }
      }, 0);
      return [...prev, { ...product, qty: 1 }];
    });
    setSearchTerm(''); 
    if (inputRef.current) inputRef.current.focus();
  };

  const updateQty = (id, newQty) => {
    if (newQty <= 0) return; 
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  const changeQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  // Helper: TAX CALCULATIONS
  const getSubtotal = () => cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const getTaxAmount = () => {
    if (!taxConfig.enabled) return 0;
    const subtotal = getSubtotal();
    return (subtotal * taxConfig.rate) / 100;
  };

  const getGrandTotal = () => getSubtotal() + getTaxAmount();

  // Helper: PAYMENT
  const handlePayment = async (method) => {
    if (cart.length === 0) return;
    
    const payload = cart.map(item => ({ id: item.id, qty: item.qty, price: item.price }));
    const calculatedTax = getTaxAmount();
    const calculatedGrandTotal = getGrandTotal();
    
    try {
      const res = await fetch('http://localhost:5000/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: payload, totalTax: calculatedTax })
      });
      
      const data = await res.json();
      
      if (data.success) {
        const saleData = {
          transactionId: data.transactionId, 
          total: calculatedGrandTotal, 
          date: new Date(),
          items: cart,
          paymentMethod: method,
          taxRate: taxConfig.rate,
          taxAmount: calculatedTax
        };
        
        setCurrentSale(saleData);
        setCart([]);
        fetchProducts(); 
        setShowCheckoutPreview(false);

        setTimeout(() => {
            window.print();
            setCurrentSale(null); 
        }, 100);
        
      } else {
        showToast(`Transaction Failed: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      showToast("Checkout failed. Check console.");
    }
  };

  const closeReceipt = () => {
    setCurrentSale(null);
    if(inputRef.current) inputRef.current.focus();
  };

  // --- COMMON STYLES ---
  const textMuted = { color: 'var(--text-color)', opacity: 0.5, fontSize: '13px' };
  const textColor = 'var(--text-color)'; // Header & Primary Text
  const buttonTextColor = 'var(--text-color)'; // Button Text
  const inputColor = 'var(--text-color)';
  const labelColor = 'var(--text-color)';
  const headerStyle = { margin: 0, fontWeight: 'bold', fontSize: '20px', color: textColor };

  return (
    <div style={{ display: 'flex', gap: '20px', height: '100%' }}>
      
      {/* LEFT SIDE: PRODUCT GRID */}
      <div className="glass-panel" style={{ flex: 2, padding: '20px', display: 'flex', flexDirection: 'column' }}>
        {/* Header & Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px', flexShrink: 0 }}>
          <h2 style={headerStyle}>POS Terminal</h2>
          <div style={{ position: 'relative', flex: 1 }}>
            <input 
              ref={inputRef}
              className="glass-input" 
              placeholder="Scan Barcode or Search Product..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ fontSize: '16px', paddingLeft: '15px', color: inputColor }}
            />
          </div>
        </div>

        {/* Grid */}
       <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 160px)',
          gridTemplateRows: 'repeat(5, 160px)',
          gap: '15px',
          paddingBottom: '10px',
          paddingRight: '5px'
        }}>
          {products.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            String(p.barcode || '').toLowerCase().includes(searchTerm.toLowerCase())
          ).map(p => (
            <div 
              key={p.id} 
              onClick={() => addToCart(p)}
              className="glass-panel"
              style={{ 
                cursor: 'pointer', 
                display: 'grid', 
                gridTemplateRows: '2fr 1fr 1fr', 
                justifyItems: 'center',
                textAlign: 'center',
                padding: '15px',
                background: 'var(--glass-btn-bg)',
                transition: 'all 0.2s',
                border: '1px solid var(--glass-border)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--glass-btn-hover-bg)';
                e.currentTarget.style.borderColor = 'var(--glass-border)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--glass-btn-bg)';
                e.currentTarget.style.borderColor = 'var(--glass-border)';
              }}
            >
              {/* Product Name */}
              <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '8px', lineHeight: '1.2', color: buttonTextColor }}>
                {p.name}
              </div>
              
              {/* Price */}
              <div style={{ color: 'var(--success)', fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
                {formatCurrency(p.price)}
              </div>

              {/* Stock */}
              <div style={{ fontSize: '13px', borderTop: '1px solid var(--glass-border)', paddingTop: '5px', width: '80%', color: labelColor }}>
                Stock: {p.quantity}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT SIDE: CART */}
      <div className="glass-panel" style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ 
          borderBottom: '1px solid var(--glass-border)', 
          paddingBottom: '15px', 
          margin: '0 0 15px 0',
          color: textColor,
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          Current Cart ({cart.length})
        </h3>
        
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {cart.length === 0 && (
            <div style={{textAlign: 'center', opacity: 0.5, marginTop: '50px', fontSize: '14px', color: labelColor }}>
              Cart is empty
            </div>
          )}
          {cart.map(item => (
            <div key={item.id} style={{
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              background: 'var(--glass-input-bg)', 
              padding: '12px', 
              borderRadius: '8px',
              border: '1px solid var(--glass-border)'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '4px', color: buttonTextColor }}>{item.name}</div>
                <div style={{...textMuted}}>{formatCurrency(item.price)} x {item.qty}</div>
              </div>
              
              {/* QUANTITY CONTROLS */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button 
                  className="glass-btn" 
                  style={{ padding: '5px 10px', fontSize: '16px', minWidth: '32px', color: buttonTextColor }} 
                  onClick={() => changeQty(item.id, -1)}
                >-</button>
                
                <input 
                  type="number"
                  ref={(el) => inputRefs.current[item.id] = el}
                  value={item.qty}
                  onChange={(e) => updateQty(item.id, parseInt(e.target.value) || 0)}
                  style={{ 
                    width: '50px', 
                    textAlign: 'center', 
                    background: 'var(--glass-input-bg)', 
                    border: '1px solid var(--glass-border)', 
                    color: textColor,
                    fontSize: '14px',
                    fontWeight: 'bold',
                    borderRadius: '4px',
                    outline: 'none'
                  }}
                />

                <button 
                  className="glass-btn" 
                  style={{ padding: '5px 10px', fontSize: '16px', minWidth: '32px', color: buttonTextColor }} 
                  onClick={() => changeQty(item.id, 1)}
                >+</button>
                
                <button 
                  className="glass-btn" 
                  style={{ 
                    padding: '5px 10px', fontSize: '16px', 
                    background: 'var(--danger-bg)', 
                    borderColor: 'var(--danger)', 
                    color: 'var(--danger)',
                    minWidth: '32px'
                  }} 
                  onClick={() => setCart(cart.filter(c => c.id !== item.id))}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* --- TAX SUMMARY --- */}
        <div style={{ 
          marginTop: 'auto', 
          borderTop: '1px solid var(--glass-border)', 
          paddingTop: '15px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '10px' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', color: textColor }}>
            <span>Subtotal:</span>
            <span>{formatCurrency(getSubtotal())}</span>
          </div>

          {taxConfig.enabled && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', color: 'var(--warning)' }}>
              <span>Tax ({taxConfig.rate}%):</span>
              <span>{formatCurrency(getTaxAmount())}</span>
            </div>
          )}

          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            fontSize: '22px', 
            fontWeight: 'bold', 
            marginTop: '5px', 
            color: 'var(--success)' 
          }}>
            <span>Total</span>
            <span>{formatCurrency(getGrandTotal())}</span>
          </div>

          {!taxConfig.enabled && (
             <div style={{ textAlign: 'center', opacity: 0.5, fontSize: '12px', marginTop: '5px', color: labelColor }}>
               VAT/GST is disabled in Settings.
             </div>
          )}
        </div>

        {/* CHECKOUT BUTTONS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
          <button 
            className="glass-btn" 
            style={{ 
              width: '100%', 
              padding: '12px', 
              fontSize: '16px', 
              fontWeight: 'bold',
              background: 'var(--danger-bg)', 
              borderColor: 'var(--danger)',
              color: 'var(--danger)'
            }}
            onClick={() => setCart([])}
            disabled={cart.length === 0}
          >
            CLEAR CART
          </button>
          <button 
            className="glass-btn" 
            style={{ 
              width: '100%', 
              padding: '12px', 
              fontSize: '16px', 
              fontWeight: 'bold',
              background: 'var(--success-bg)', 
              borderColor: 'var(--success)',
              color: 'var(--success)'
            }}
            onClick={() => setShowCheckoutPreview(true)}
            disabled={cart.length === 0}
          >
            CHECKOUT
          </button>
        </div>
      </div>

      {/* CHECKOUT PREVIEW MODAL */}
      {showCheckoutPreview && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'var(--modal-overlay)', 
          display: 'flex', justifyContent: 'center', alignItems: 'center', 
          zIndex: 1000,
          backdropFilter: 'blur(5px)'
        }}>
          <div className="glass-panel" style={{ 
            padding: '30px', 
            width: '450px', 
            display: 'flex', 
            flexDirection: 'column',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
          }}>
            <h2 style={{textAlign: 'center', margin: '0 0 20px 0', color: textColor, fontSize: '24px'}}>Payment</h2>
            
            <div style={{
              flex: 1, 
              overflowY: 'auto', 
              marginBottom: '20px', 
              maxHeight: '300px', 
              borderBottom: '1px solid var(--glass-border)', 
              paddingBottom: '15px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {cart.map(item => (
                <div key={item.id} style={{
                  display: 'flex', justifyContent: 'space-between', 
                  fontSize: '14px', color: textColor
                }}>
                  <span>{item.name} <span style={{opacity: 0.5}}>(x{item.qty})</span></span>
                  <span>{formatCurrency(item.price * item.qty)}</span>
                </div>
              ))}
            </div>

            {/* SUMMARY IN MODAL */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--glass-border)', paddingTop: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', color: textColor }}>
                <span>Subtotal</span>
                <span>{formatCurrency(getSubtotal())}</span>
              </div>
              {taxConfig.enabled && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', color: 'var(--warning)' }}>
                  <span>Tax ({taxConfig.rate}%)</span>
                  <span>{formatCurrency(getTaxAmount())}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 'bold', marginTop: '5px', color: 'var(--success)' }}>
                <span>Total</span>
                <span>{formatCurrency(getGrandTotal())}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  className="glass-btn" 
                  style={{ 
                    flex: 1, padding: '15px', fontSize: '16px', fontWeight: 'bold', 
                    background: 'var(--success-bg)', borderColor: 'var(--success)', color: 'var(--success)' 
                  }}
                  onClick={() => handlePayment('Cash')}
                >
                  CASH
                </button>
                <button 
                  className="glass-btn" 
                  style={{ 
                    flex: 1, padding: '15px', fontSize: '16px', fontWeight: 'bold', 
                    background: 'var(--warning-bg)', borderColor: 'var(--warning)', color: 'var(--warning)' 
                  }}
                  onClick={() => handlePayment('MoMo/Card')}
                >
                  MoMo / CARD
                </button>
              </div>
              
              <button 
                className="glass-btn" 
                style={{ padding: '12px', fontSize: '14px', width: '100%', background: 'var(--glass-btn-bg)', color: textColor }}
                onClick={() => setShowCheckoutPreview(false)}
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT MODAL */}
      {currentSale && (
        <div className="receipt-printable" style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'var(--modal-overlay)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000
        }}>
          <div style={{
            background: 'white', color: 'black', width: '340px', padding: '20px',
            boxShadow: '0 0 30px rgba(0, 0, 0, 0.5)', fontFamily: 'monospace', borderRadius: '4px'
          }}>
            {/* --- DYNAMIC HEADER --- */}
            <div style={{textAlign: 'center', marginBottom: '15px', borderBottom: '1px dashed #000', paddingBottom: '10px'}}>
              <h2 style={{margin: 0, fontSize: '18px', textTransform: 'uppercase', color: '#111827'}}>{companyDetails.name}</h2>
              <p style={{margin: '2px 0', fontSize: '12px', color: '#111827'}}>{companyDetails.address}</p>
              <p style={{margin: '2px 0', fontSize: '12px', color: '#111827'}}>{companyDetails.location}</p>
              <p style={{margin: '2px 0', fontSize: '12px', color: '#111827'}}>{companyDetails.phone}</p>
            </div>

            {/* --- DETAILS --- */}
            <div style={{marginBottom: '15px', fontSize: '13px', color: '#111827'}}>
              <p style={{margin: '2px 0'}}><strong style={{color: '#111827'}}>Date:</strong> {formatDate(currentSale.date)} {formatTime(currentSale.date)}</p>
              <p style={{margin:'2px 0'}}><strong style={{color: '#111827'}}>Trans ID:</strong> {currentSale.transactionId}</p>
              <p style={{margin:'2px 0'}}><strong style={{color: '#111827'}}>Method:</strong> {currentSale.paymentMethod.toUpperCase()}</p>
            </div>

            {/* --- ITEMS --- */}
            <div style={{marginBottom: '15px', borderBottom: '1px dashed #000', paddingBottom: '15px'}}>
              {currentSale.items.map(item => (
                <div key={item.id} style={{display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '13px', color: '#111827'}}>
                  <span>{item.name} x{item.qty}</span>
                  <span>{formatCurrency(item.price * item.qty).replace('GHS ', '')}</span>
                </div>
              ))}
            </div>

            {/* --- SUMMARY SECTION (Tax Aware) --- */}
            <div style={{borderTop: '1px dashed #000', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '20px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#666'}}>
                <span>Subtotal:</span>
                <span>{formatCurrency(getSubtotal()).replace('GHS ', '')}</span>
              </div>
              
              {taxConfig.enabled && (
                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#666'}}>
                  <span>Tax ({taxConfig.rate}%):</span>
                  <span>{formatCurrency(currentSale.taxAmount).replace('GHS ', '')}</span>
                </div>
              )}

              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold', marginTop: '5px', color: 'black'}}>
                <span>TOTAL</span>
                <span>{formatCurrency(currentSale.total).replace('GHS ', '')}</span>
              </div>
            </div>

            {/* --- DYNAMIC FOOTER --- */}
            <div style={{textAlign: 'center', marginTop: '10px', fontSize: '12px', fontStyle: 'italic', color: '#555'}}>
              <p style={{margin: 0}}>{companyDetails.footer || 'Thank you for your business!'}</p>
            </div>

            {/* --- PRINT ACTIONS --- */}
            <div className="payment-actions" style={{marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '10px'}}>
              <button 
                onClick={() => window.print()} 
                style={{
                  padding: '12px', fontSize: '16px', cursor: 'pointer', 
                  background: 'black', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold'
                }}
              >
                PRINT RECEIPT
              </button>
              <button 
                onClick={closeReceipt} 
                style={{
                  padding: '12px', fontSize: '16px', cursor: 'pointer', 
                  background: '#e5e7eb', color: 'black', border: 'none', borderRadius: '4px', fontWeight: 'bold'
                }}
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}