import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import POSTerminal from './components/POSTerminal';
import Accounting from './components/Accounting';

// Import Icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faBoxOpen, faCashRegister, faFileInvoiceDollar } from '@fortawesome/free-solid-svg-icons';

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar Navigation */}
      <div className="glass-panel" style={{ 
        width: '260px', 
        padding: '20px 10px', 
        marginRight: '0px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '15px' 
      }}>
        
        {/* Logo and POS Label Container */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '10px',              
          marginBottom: '10px'       
        }}>
          <img 
            src="/yames-removebg-preview.png" 
            alt="Yames Logo" 
            style={{ 
              width: '70px',         
              height: 'auto',        
              borderRadius: '50%',   
              margin: 0              
            }} 
          />
          <span style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            letterSpacing: '1px',
            color: 'white'
          }}>
            POS
          </span>
        </div>
        
        <button 
          className={`glass-btn ${activeView === 'dashboard' ? 'bg-white/40' : ''}`} 
          style={{ fontSize: '17px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px' }}
          onClick={() => setActiveView('dashboard')}
        >
          <FontAwesomeIcon icon={faChartLine} style={{ fontSize: '20px' }} /> Dashboard
        </button>
        
        <button 
          className={`glass-btn ${activeView === 'inventory' ? 'bg-white/40' : ''}`} 
          style={{ fontSize:'17px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px' }}
          onClick={() => setActiveView('inventory')}
        >
          <FontAwesomeIcon icon={faBoxOpen} style={{ fontSize: '20px' }} /> Inventory
        </button>
        
        <button 
          className={`glass-btn ${activeView === 'pos' ? 'bg-white/40' : ''}`} 
          style={{ fontSize: '17px',display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px' }}
          onClick={() => setActiveView('pos')}
        >
          <FontAwesomeIcon icon={faCashRegister} style={{ fontSize: '20px' }} /> POS Terminal
        </button>
        
        <button 
          className={`glass-btn ${activeView === 'accounting' ? 'bg-white/40' : ''}`} 
          style={{ fontSize: '17px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px' }}
          onClick={() => setActiveView('accounting')}
        >
          <FontAwesomeIcon icon={faFileInvoiceDollar} style={{ fontSize: '20px' }} /> Accounting
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '20px', overflow: 'hidden' }}>
        {activeView === 'dashboard' && <Dashboard />}
        {activeView === 'inventory' && <Inventory />}
        {activeView === 'pos' && <POSTerminal />}
        {activeView === 'accounting' && <Accounting />}
      </div>
    </div>
  );
}