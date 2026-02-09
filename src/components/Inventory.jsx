import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { formatCurrency, formatDate } from '../utils';

export default function Inventory({ theme, showToast }) {
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [form, setForm] = useState({ id: null, name: '', barcode: '', price: '', cost: '', quantity: '' });
  
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemList, setNewItemList] = useState([{ name: '', barcode: '', price: '', cost: '', quantity: '', isExisting: false }]);
  const [lastCreatedBatchId, setLastCreatedBatchId] = useState(null);
  const [batchItems, setBatchItems] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [currentEditItem, setCurrentEditItem] = useState({ id: null, name: '', barcode: '', price: '', cost: '', quantity: '' });
  
  const fileInputRef = useRef(null);
  const barcodeInputRef = useRef(null);
  const scanInputRef = useRef(null);

  // Helper for theme color
  const textColor = 'var(--text-color)';
  const buttonTextColor = 'var(--text-color)';
  const labelColor = 'var(--text-color)';

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 'bold',
    fontSize: '14px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase'
  };

  const loadProducts = () => {
    fetch('http://localhost:5000/api/products')
      .then(res => res.json())
      .then(data => setProducts(data));
  };

  const loadBatches = () => {
    fetch('http://localhost:5000/api/batches')
      .then(res => res.json())
      .then(data => setBatches(data))
      .catch(console.error);
  };

  useEffect(() => { 
    loadProducts(); 
    loadBatches();
  }, []);

  // Auto-focus the scanner input when the Add Modal opens
  useEffect(() => {
    if (showAddModal && scanInputRef.current) {
      scanInputRef.current.focus();
    }
  }, [showAddModal]);

  const handleBarcodeInput = (e) => {
    const val = e.target.value;
    setForm({ ...form, barcode: val }); 
    if (val.length > 0) {
      const exactMatch = products.find(p => p.barcode === val);
      if (exactMatch) {
        setForm({
          id: exactMatch.id,
          name: exactMatch.name,
          barcode: exactMatch.barcode,
          price: exactMatch.price,
          cost: exactMatch.cost,
          quantity: exactMatch.quantity
        });
      }
    }
  };

  const filteredBatches = batches.filter(b => {
    const term = form.barcode.toLowerCase();
    if (!term) return true;
    const idMatch = b.batch_id.toLowerCase().includes(term);
    const dateMatch = formatDate(b.date).toLowerCase().includes(term);
    return idMatch || dateMatch;
  });

  const handleImportClick = () => fileInputRef.current.click();

  const generateShortBarcode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'BAR-';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const rawData = XLSX.utils.sheet_to_json(ws); 
      const normalizedData = rawData.map(row => ({
        name: row.name || row.Name || 'Unknown',
        barcode: String(row.barcode || row.Barcode || ''),
        price: parseFloat(row.price || row.Price || 0),
        cost: parseFloat(row.cost || row.Cost || 0),
        quantity: parseInt(row.quantity || row.Quantity || row.Qty || 0)
      }));

      fetch('http://localhost:5000/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: normalizedData })
      })
      .then(res => res.json())
      .then(response => {
        showToast(response.message);
        loadProducts();
        loadBatches();
      });
    };
    reader.readAsBinaryString(file);
    e.target.value = null; 
  };

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

  const handleUpdateSave = async () => {
    const response = await fetch(`http://localhost:5000/api/products/${currentEditItem.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentEditItem)
    });
    if (response.ok) {
      showToast("Item updated successfully!");
      setShowUpdateModal(false);
      loadProducts(); 
      if (showBatchModal && selectedBatchId) handleViewBatch(selectedBatchId);
    } else {
      showToast("Failed to update item.");
    }
  };

  const handleBarcodeScan = (e) => {
    if (e.key === 'Enter') {
      const scannedBarcode = e.target.value.trim();
      if (!scannedBarcode) return;
      const existingIndex = newItemList.findIndex(item => item.barcode === scannedBarcode);
      if (existingIndex !== -1) {
        const list = [...newItemList];
        const currentQty = parseInt(list[existingIndex].quantity) || 0;
        list[existingIndex].quantity = currentQty + 1;
        setNewItemList(list);
      } else {
        const product = products.find(p => p.barcode === scannedBarcode);
        if (product) {
          setNewItemList([...newItemList, {
            name: product.name,
            barcode: product.barcode,
            cost: product.cost,
            price: product.price,
            quantity: 1, 
            isExisting: true
          }]);
        } else {
          setNewItemList([...newItemList, {
            name: '',
            barcode: scannedBarcode,
            cost: '',
            price: '',
            quantity: 1,
            isExisting: false
          }]);
        }
      }
      e.target.value = '';
    }
  };

  const handleSaveEntry = async () => {
    if (newItemList.some(item => !item.name || !item.price || !item.cost || !item.quantity)) {
      showToast("Please fill in all fields for all items.");
      return;
    }
    const itemsToSave = newItemList.map(item => ({ ...item, barcode: item.barcode || generateShortBarcode() }));
    try {
      const response = await fetch('http://localhost:5000/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsToSave })
      });
      const data = await response.json();
      if (data.success) {
        showToast(data.message);
        setLastCreatedBatchId(data.batchId);
        loadProducts();
        loadBatches();
        setShowAddModal(false); // Close modal on success
      } else {
        showToast("Error: " + data.error);
      }
    } catch (error) {
      console.error("Save error:", error);
      showToast("Failed to save entries.");
    }
  };

  const handleAddRow = () => {
    setNewItemList([...newItemList, { name: '', barcode: '', price: '', cost: '', quantity: '', isExisting: false }]);
  };

  const handleRemoveRow = (index) => {
    if (newItemList.length > 1) {
      const newList = [...newItemList];
      newList.splice(index, 1);
      setNewItemList(newList);
    }
  };

  const handleNewItemChange = (index, field, value) => {
    const newList = [...newItemList];
    newList[index][field] = value;
    setNewItemList(newList);
  };

  const openUpdateModal = (item) => {
    setCurrentEditItem(item);
    setShowUpdateModal(true);
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexShrink: 0, gap: '20px' }}>
        <h2 style={{margin:0, whiteSpace:'nowrap', color: textColor, fontSize: '24px', fontWeight: 'bold'}}>Inventory Management</h2>
        <div style={{ display: 'flex', gap: '10px', flex: 1, justifyContent: 'flex-end' }}>
          <input 
            ref={barcodeInputRef}
            className="glass-input" 
            placeholder="🔍 Scan Barcode / Search Batch ID / Date" 
            style={{ width: '350px', color: buttonTextColor }} 
            value={form.barcode} 
            onChange={handleBarcodeInput} 
            autoFocus 
          />
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} accept=".xlsx, .xls" />
          <button className="glass-btn" onClick={() => {
            setNewItemList([{ name: '', barcode: '', price: '', cost: '', quantity: '', isExisting: false }]);
            setLastCreatedBatchId(null);
            setShowAddModal(true);
          }} style={{ whiteSpace: 'nowrap', color: buttonTextColor }}>➕ Add Entry</button>
          <button className="glass-btn" onClick={handleImportClick} style={{ whiteSpace: 'nowrap', color: buttonTextColor }}>📂 Import Excel</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, marginTop: '0px' }}>
        <h3 style={{marginTop: 0, marginBottom: '10px', color: textColor, fontSize: '18px'}}>Batch History</h3>
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
          <tbody style={{ fontSize: '14px' }}> 
            {filteredBatches.length === 0 && (
              <tr>
                <td colSpan="5" style={{textAlign: 'center', padding: '20px', opacity: 0.6, color: labelColor}}>
                  {form.barcode.length > 0 ? 'No matching batches found.' : 'No batches found.'}
                </td>
              </tr>
            )}
            {filteredBatches.map(b => (
              <tr key={b.batch_id} style={{ borderBottom: '1px solid var(--table-border)' }}>
                <td style={{padding: '10px', color: textColor}}>{formatDate(b.date)}</td>
                <td style={{padding: '10px', fontFamily: 'monospace', color: textColor}}>{b.batch_id}</td>
                <td style={{padding: '10px', color: textColor}}>{formatCurrency(b.total_price)}</td>
                <td style={{padding: '10px', color: textColor}}>{formatCurrency(b.total_cost)}</td>
                <td style={{padding: '10px'}}>
                  <button 
                    className="glass-btn" 
                    style={{padding:'4px 10px', fontSize:'12px'}}
                    onClick={() => handleViewBatch(b.batch_id)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- BATCH ITEMS MODAL --- */}
      {showBatchModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--modal-overlay)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div className="glass-panel" style={{ padding: '30px', width: '900px', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{marginTop:0, marginBottom:0, color: textColor, fontSize: '20px'}}>Items in Batch: <span style={{fontFamily: 'monospace'}}>{selectedBatchId}</span></h3>
              <button className="glass-btn" onClick={() => setShowBatchModal(false)} style={{ color: buttonTextColor }}>✕ Close</button>
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
                    <th style={{padding: '10px', color: textColor}}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {batchItems.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--table-border)', whiteSpace: 'nowrap' }}>
                      <td style={{padding: '10px', color: textColor}}>{item.name}</td>
                      <td style={{padding: '10px', fontFamily: 'monospace', color: textColor}}>{item.barcode}</td>
                      <td style={{padding: '10px', color: textColor}}>{formatCurrency(item.cost)}</td>
                      <td style={{padding: '10px', color: textColor}}>{formatCurrency(item.price)}</td>
                      <td style={{padding: '10px', color: textColor}}>{item.quantity}</td>
                      <td style={{padding: '10px'}}>
                        <button 
                          className="glass-btn" 
                          style={{padding:'4px 8px', fontSize:'12px', background: 'rgba(59, 130, 246, 0.3)', borderColor: '#3b82f6', color: 'var(--text-info)'}}
                          onClick={() => openUpdateModal(item)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- UPDATE MODAL --- */}
      {showUpdateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'var(--modal-overlay)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10001 }}>
          <div className="glass-panel" style={{ padding: '30px', width: '500px', boxSizing: 'border-box' }}>
            <h3 style={{marginTop:0, color: textColor, fontSize: '20px'}}>Update Item</h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px'}}>
              <label style={{...labelStyle, color: labelColor}}>Name</label>
              <input 
                className="glass-input" 
                placeholder="Name" 
                value={currentEditItem.name} 
                onChange={e => setCurrentEditItem({...currentEditItem, name: e.target.value})} 
              />
              <label style={{...labelStyle, color: labelColor}}>Barcode</label>
              <input 
                className="glass-input" 
                placeholder="Barcode" 
                value={currentEditItem.barcode} 
                readOnly
                style={{ background: 'var(--glass-btn-bg)', cursor: 'not-allowed', color: 'var(--text-color)', opacity: 0.6 }}
              />
              <div style={{display:'flex', gap:'5px'}}>
                <div style={{flex: 1}}>
                  <label style={{...labelStyle, color: labelColor}}>Price</label>
                  <input 
                    className="glass-input" 
                    placeholder="Price" 
                    type="number"
                    value={currentEditItem.price} 
                    onChange={e => setCurrentEditItem({...currentEditItem, price: e.target.value})} 
                  />
                </div>
                <div style={{flex: 1}}>
                  <label style={{...labelStyle, color: labelColor}}>Cost</label>
                  <input 
                    className="glass-input" 
                    placeholder="Cost" 
                    type="number"
                    value={currentEditItem.cost} 
                    onChange={e => setCurrentEditItem({...currentEditItem, cost: e.target.value})} 
                  />
                </div>
              </div>
              <label style={{...labelStyle, color: labelColor}}>Quantity</label>
              <input 
                className="glass-input" 
                placeholder="Quantity" 
                type="number"
                value={currentEditItem.quantity} 
                onChange={e => setCurrentEditItem({...currentEditItem, quantity: e.target.value})} 
              />
            </div>
            <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
              <button 
                className="glass-btn" 
                style={{flex: 1, background: 'var(--success-bg)', borderColor: 'var(--success)', color: textColor}}
                onClick={handleUpdateSave}
              >
                Save Changes
              </button>
              <button 
                className="glass-btn" 
                style={{flex: 1, background: 'var(--danger-bg)', borderColor: 'var(--danger)', color: textColor}}
                onClick={() => setShowUpdateModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD ENTRY MODAL --- */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'var(--modal-overlay)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10001 }}>
          <div className="glass-panel" style={{ padding: '30px', width: '90%', maxWidth: '1000px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{marginTop:0, color: textColor, fontSize: '20px'}}>Manual Item Entry</h3>
              <div style={{display:'flex', gap:'10px'}}>
                {lastCreatedBatchId && (
                  <button 
                    className="glass-btn" 
                    style={{background: 'var(--info-bg)', borderColor: 'var(--info)', color: textColor}}
                    onClick={() => handleViewBatch(lastCreatedBatchId)}
                  >
                     View Created Batch
                  </button>
                )}
                <button className="glass-btn" onClick={() => setShowAddModal(false)} style={{ color: buttonTextColor }}>✕ Close</button>
              </div>
            </div>

            {/* SCANNER INPUT */}
            <div style={{ padding: '15px', background: 'var(--success-bg)', borderRadius: '8px', border: '1px dashed var(--success)', marginBottom: '15px' }}>
              <label style={{...labelStyle, color: labelColor, marginBottom: '5px'}}>Quick Add (Scan Barcode)</label>
              <input
                ref={scanInputRef}
                className="glass-input"
                placeholder="Scan barcode here and press Enter..."
                onKeyDown={handleBarcodeScan}
                style={{ width: '33.33%', fontSize: '16px', padding: '10px', background: 'var(--glass-input-bg)', color: textColor }}
              />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px' }}>
              <table className="data-view-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--table-header-bg)', zIndex: 10 }}>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <th style={{padding: '10px', color: textColor}}>Name</th>
                    <th style={{padding: '10px', color: textColor}}>Barcode</th>
                    <th style={{padding: '10px', color: textColor}}>Cost</th>
                    <th style={{padding: '10px', color: textColor}}>Price</th>
                    <th style={{padding: '10px', color: textColor}}>Quantity</th>
                    <th style={{padding: '10px', color: textColor}}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {newItemList.map((item, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid var(--table-border)' }}>
                      <td style={{padding: '5px'}}>
                        <input 
                          className="glass-input" 
                          style={{
                            width: '100%',
                            background: item.isExisting ? 'var(--glass-btn-bg)' : '',
                            cursor: item.isExisting ? 'not-allowed' : '',
                            color: item.isExisting ? 'var(--text-color)' : ''
                          }}
                          value={item.name} 
                          onChange={e => handleNewItemChange(index, 'name', e.target.value)} 
                        />
                      </td>
                      <td style={{padding: '5px'}}>
                        <input 
                          className="glass-input" 
                          style={{
                            width: '100%',
                            background: item.isExisting ? 'var(--glass-btn-bg)' : '',
                            color: item.isExisting ? 'var(--text-color)' : ''
                          }}
                          placeholder="Auto-generated if empty"
                          value={item.barcode} 
                          onChange={e => handleNewItemChange(index, 'barcode', e.target.value)} 
                        />
                      </td>
                      <td style={{padding: '5px'}}>
                        <input 
                          type="number"
                          className="glass-input" 
                          style={{width: '100%'}}
                          value={item.cost} 
                          onChange={e => handleNewItemChange(index, 'cost', e.target.value)} 
                        />
                      </td>
                      <td style={{padding: '5px'}}>
                        <input 
                          type="number"
                          className="glass-input" 
                          style={{width: '100%'}}
                          value={item.price} 
                          onChange={e => handleNewItemChange(index, 'price', e.target.value)} 
                        />
                      </td>
                      <td style={{padding: '5px'}}>
                        <input 
                          type="number"
                          className="glass-input" 
                          style={{width: '100%'}}
                          value={item.quantity} 
                          onChange={e => handleNewItemChange(index, 'quantity', e.target.value)} 
                        />
                      </td>
                      <td style={{padding: '5px'}}>
                        <button 
                          className="glass-btn" 
                          style={{padding: '5px 10px', color: 'var(--danger)', borderColor: 'var(--danger)'}}
                          onClick={() => handleRemoveRow(index)}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button 
                className="glass-btn" 
                style={{marginTop: '10px', width: '100%', borderStyle: 'dashed', color: buttonTextColor}}
                onClick={handleAddRow}
              >
                + Add Another Row
              </button>
            </div>

            <div style={{display: 'flex', gap: '10px'}}>
              <button 
                className="glass-btn" 
                style={{flex: 1, background: 'var(--success-bg)', borderColor: 'var(--success)', padding: '15px', color: buttonTextColor}}
                onClick={handleSaveEntry}
              >
                 Save Entries
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}