import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { formatCurrency, formatDate } from '../utils';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ id: null, name: '', barcode: '', price: '', cost: '', quantity: '' });
  const [selectedIds, setSelectedIds] = useState(new Set());
  
  // NEW: State for filtering the table
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for the Update Modal
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState({ id: null, name: '', barcode: '', price: '', cost: '', quantity: '' });
  
  const fileInputRef = useRef(null);
  const barcodeInputRef = useRef(null);

  const loadProducts = () => {
    fetch('http://localhost:5000/api/products')
      .then(res => res.json())
      .then(data => setProducts(data));
  };

  useEffect(() => { loadProducts(); }, []);

  // COMBINED LOGIC: Search Filter + Auto-Fill Details
  const handleBarcodeInput = (e) => {
    const val = e.target.value;
    setForm({ ...form, barcode: val }); // Update form state
    setSearchTerm(val); // Update filter state

    // 1. Filter Logic is handled by 'filteredProducts' variable below
    // 2. Auto-Fill Details Logic (Exact Match)
    if (val.length > 0) {
      const exactMatch = products.find(p => p.barcode === val);
      if (exactMatch) {
        // Load details into the top form
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

  const handleImportClick = () => fileInputRef.current.click();

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
        alert(response.message);
        loadProducts();
        setSearchTerm(''); // Clear search after import
      });
    };
    reader.readAsBinaryString(file);
    e.target.value = null; 
  };

  const toggleSelect = (id) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) newSelection.delete(id);
    else newSelection.add(id);
    setSelectedIds(newSelection);
  };

  const handleAdd = async () => {
    const payload = { 
      ...form, 
      price: parseFloat(form.price), 
      cost: parseFloat(form.cost),
      quantity: parseInt(form.quantity) 
    };

    await fetch('http://localhost:5000/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    // Reset Form and Search
    setForm({ id: null, name: '', barcode: '', price: '', cost: '', quantity: '' });
    setSearchTerm('');
    loadProducts();
  };

  const openUpdateModal = (product) => {
    setCurrentEditItem({
      id: product.id,
      name: product.name,
      barcode: product.barcode,
      price: product.price,
      cost: product.cost,
      quantity: product.quantity
    });
    setShowUpdateModal(true);
  };

  const handleUpdateSave = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/products/${currentEditItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentEditItem)
      });

      if (response.ok) {
        alert("Item updated successfully!");
        setShowUpdateModal(false);
        loadProducts(); 
      } else {
        alert("Failed to update item.");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating item.");
    }
  };

  // Filter the table list based on the search term
  const filteredProducts = products.filter(product => {
    const term = searchTerm.toLowerCase();
    const nameMatch = product.name.toLowerCase().includes(term);
    const barcodeMatch = String(product.barcode).toLowerCase().includes(term);
    const idMatch = String(product.inventory_id || '').toLowerCase().includes(term);
    return nameMatch || barcodeMatch || idMatch;
  });

  return (
    <div className="glass-panel" style={{ padding: '20px', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>Inventory Management</h2>
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} accept=".xlsx, .xls" />
        <button className="glass-btn" onClick={handleImportClick}>📂 Import Excel</button>
      </div>

      {/* TOP FORM: DUAL PURPOSE SEARCH & ADD */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input 
          ref={barcodeInputRef}
          className="glass-input" 
          placeholder="🔍 Scan/Type Barcode (Filters List)" 
          style={{width: '180px'}} 
          value={form.barcode} 
          onChange={handleBarcodeInput} // UPDATED HANDLER
          autoFocus 
        />
        <input className="glass-input" placeholder="Name" style={{flex:1}} value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
        <input className="glass-input" placeholder="Price" type="number" style={{width: '100px'}} value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
        <input className="glass-input" placeholder="Cost" type="number" style={{width: '100px'}} value={form.cost} onChange={e => setForm({...form, cost: e.target.value})} />
        <input className="glass-input" placeholder="Qty" type="number" style={{width: '80px'}} value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
        <button className="glass-btn" onClick={handleAdd}>
          {form.id ? '✏️ Update' : '➕ Add New'}
        </button>
      </div>
      
      {/* TABLE LIST: NOW FILTERED */}
      <div style={{overflowY: 'auto', height: 'calc(100% - 140px)'}}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.3)' }}>
              <th style={{width:'40px'}}>Select</th>
              <th>Name</th><th>Batch ID</th><th>Barcode</th><th>Price</th><th>Cost</th><th>Stock</th><th>Date Added</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <td onClick={(e) => { e.stopPropagation(); toggleSelect(p.id); }} style={{textAlign:'center'}}>
                  <input type="checkbox" checked={selectedIds.has(p.id)} readOnly />
                </td>
                <td style={{padding:'10px'}}>{p.name}</td>
                <td style={{fontSize:'12px', opacity:0.7}}>{p.inventory_id || '-'}</td>
                <td>{p.barcode}</td>
                <td>{formatCurrency(p.price)}</td>
                <td>{formatCurrency(p.cost)}</td>
                <td>{p.quantity}</td>
                <td style={{fontSize:'12px'}}>{formatDate(p.date_added)}</td>
                <td>
                  <button 
                    className="glass-btn" 
                    style={{padding: '5px 10px', fontSize: '12px'}}
                    onClick={() => openUpdateModal(p)}
                  >
                    ✏️ Update
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- UPDATE MODAL --- */}
      {showUpdateModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="glass-panel" style={{ padding: '30px', width: '400px' }}>
            <h3 style={{marginTop:0}}>Update Item</h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px'}}>
              <input 
                className="glass-input" 
                placeholder="Name" 
                value={currentEditItem.name} 
                onChange={e => setCurrentEditItem({...currentEditItem, name: e.target.value})} 
              />
              <input 
                className="glass-input" 
                placeholder="Barcode" 
                value={currentEditItem.barcode} 
                onChange={e => setCurrentEditItem({...currentEditItem, barcode: e.target.value})} 
              />
              <div style={{display:'flex', gap:'10px'}}>
                <input 
                  className="glass-input" 
                  placeholder="Price" 
                  type="number"
                  style={{flex:1}}
                  value={currentEditItem.price} 
                  onChange={e => setCurrentEditItem({...currentEditItem, price: e.target.value})} 
                />
                <input 
                  className="glass-input" 
                  placeholder="Cost" 
                  type="number"
                  style={{flex:1}}
                  value={currentEditItem.cost} 
                  onChange={e => setCurrentEditItem({...currentEditItem, cost: e.target.value})} 
                />
              </div>
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
                style={{flex: 1, background: 'rgba(0,255,0,0.2)', borderColor: 'rgba(0,255,0,0.4)'}}
                onClick={handleUpdateSave}
              >
                Save Changes
              </button>
              <button 
                className="glass-btn" 
                style={{flex: 1, background: 'rgba(255,0,0,0.2)', borderColor: 'rgba(255,0,0,0.4)'}}
                onClick={() => setShowUpdateModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}