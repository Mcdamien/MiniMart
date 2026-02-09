import { useState, useCallback } from 'react';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import POSTerminal from './components/POSTerminal';
import Accounting from './components/Accounting';
import Settings from './components/Settings';

// Import Icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faBoxOpen, faCashRegister, faFileInvoiceDollar, faCog, faSignOutAlt, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [theme, setTheme] = useState('dark');
  const [toast, setToast] = useState({ show: false, message: '' });

  const showToast = useCallback((message) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast({ show: false, message: '' });
    }, 3000);
  }, []);

  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to close the application?");
    if (confirmLogout) {
      window.close();
    }
  };

  return (
    <div className={theme === 'light' ? 'light-theme' : ''} style={{ 
      display: 'flex', 
      height: '100vh', 
      overflow: 'hidden',
      backgroundColor: 'var(--bg-color)',
      color: 'var(--text-color)'
    }}>
      
      {/* Toast Notification */}
      <div id="toast" className={toast.show ? 'show' : ''}>
        <FontAwesomeIcon icon={faCheckCircle} style={{ marginRight: '10px' }} />
        {toast.message}
      </div>
      
      {/* Sidebar */}
      <div className="glass-panel" style={{ 
        width: '230px', 
        padding: '20px 10px', 
        marginRight: '0px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '15px',
        flexShrink: 0,
        borderRadius: 0,
        borderLeft: 'none',
        borderTop: 'none',
        borderBottom: 'none'
      }}>
        
        {/* Logo Container */}
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
              height: '70px',        
              borderRadius: '50%',   
              background: 'white',   
              padding: '5px',        
              objectFit: 'contain',  
              margin: 0              
            }} 
          />
          <span style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            letterSpacing: '1px',
            color: 'var(--text-color)'
          }}>
            POS
          </span>
        </div>
        
        {/* NAVIGATION BUTTONS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
          <button 
            className={`glass-btn ${activeView === 'dashboard' ? 'active-view' : ''}`} 
            style={{ 
              fontSize: '17px', 
              display: 'flex', 
              justifyContent: 'flex-start', 
              alignItems: 'center', 
              gap: '15px', 
              padding: '12px 20px', 
              width: '100%', 
              color: 'var(--text-color)',
              background: activeView === 'dashboard' ? 'var(--glass-btn-hover-bg)' : 'var(--glass-btn-bg)'
            }}
            onClick={() => setActiveView('dashboard')}
          >
            <FontAwesomeIcon icon={faChartLine} style={{ fontSize: '20px', width: '25px', color: 'var(--text-color)' }} /> 
            <span style={{fontWeight: 'bold'}}>Dashboard</span>
          </button>
          
          <button 
            className={`glass-btn ${activeView === 'inventory' ? 'active-view' : ''}`} 
            style={{ 
              fontSize:'17px', 
              display: 'flex', 
              justifyContent: 'flex-start', 
              alignItems: 'center', 
              gap: '15px', 
              padding: '12px 20px', 
              width: '100%', 
              color: 'var(--text-color)',
              background: activeView === 'inventory' ? 'var(--glass-btn-hover-bg)' : 'var(--glass-btn-bg)'
            }}
            onClick={() => setActiveView('inventory')}
          >
            <FontAwesomeIcon icon={faBoxOpen} style={{ fontSize: '20px', width: '25px', color: 'var(--text-color)' }} /> 
            <span style={{fontWeight: 'bold'}}>Inventory</span>
          </button>
          
          <button 
            className={`glass-btn ${activeView === 'pos' ? 'active-view' : ''}`} 
            style={{ 
              fontSize: '17px', 
              display: 'flex', 
              justifyContent: 'flex-start', 
              alignItems: 'center', 
              gap: '15px', 
              padding: '12px 20px', 
              width: '100%', 
              color: 'var(--text-color)',
              background: activeView === 'pos' ? 'var(--glass-btn-hover-bg)' : 'var(--glass-btn-bg)'
            }}
            onClick={() => setActiveView('pos')}
          >
            <FontAwesomeIcon icon={faCashRegister} style={{ fontSize: '20px', width: '25px', color: 'var(--text-color)' }} /> 
            <span style={{fontWeight: 'bold'}}>POS Terminal</span>
          </button>
          
          <button 
            className={`glass-btn ${activeView === 'accounting' ? 'active-view' : ''}`} 
            style={{ 
              fontSize: '17px', 
              display: 'flex', 
              justifyContent: 'flex-start', 
              alignItems: 'center', 
              gap: '15px', 
              padding: '12px 20px', 
              width: '100%', 
              color: 'var(--text-color)',
              background: activeView === 'accounting' ? 'var(--glass-btn-hover-bg)' : 'var(--glass-btn-bg)'
            }}
            onClick={() => setActiveView('accounting')}
          >
            <FontAwesomeIcon icon={faFileInvoiceDollar} style={{ fontSize: '20px', width: '25px', color: 'var(--text-color)' }} /> 
            <span style={{fontWeight: 'bold'}}>Accounting</span>
          </button>
        </div>

        {/* FOOTER ACTIONS */}
        <div style={{ 
            display: 'flex', 
            flexDirection: 'row', 
            gap: '5px', 
            marginTop: 'auto' 
        }}>
            <button 
            className="glass-btn" 
            title="Logout"
            style={{ 
                flex: 1, 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                padding: '12px',
                background: 'rgba(255, 50, 50, 0.2)', 
                border: '1px solid var(--glass-border)',
                color: 'var(--text-danger)'
            }}
            onClick={handleLogout}
            >
            <FontAwesomeIcon icon={faSignOutAlt} style={{ fontSize: '18px' }} /> 
            </button>

            <button 
            className="glass-btn" 
            style={{ 
                flex: 2,
                fontSize: '17px', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                gap: '10px', 
                padding: '12px',
                background: activeView === 'settings' ? 'var(--glass-btn-hover-bg)' : 'var(--glass-btn-bg)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-color)'
            }}
            onClick={() => setActiveView('settings')}
            >
            <FontAwesomeIcon icon={faCog} spin={activeView === 'settings'} style={{ color: 'var(--text-color)' }} /> 
            <span>Settings</span>
            </button>
        </div>

      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '20px', overflow: 'hidden' }}>
        {activeView === 'dashboard' && <Dashboard theme={theme} showToast={showToast} />}
        {activeView === 'inventory' && <Inventory theme={theme} showToast={showToast} />}
        {activeView === 'pos' && <POSTerminal theme={theme} showToast={showToast} />}
        {activeView === 'accounting' && <Accounting theme={theme} showToast={showToast} />}
        {activeView === 'settings' && <Settings theme={theme} setTheme={setTheme} showToast={showToast} />}
      </div>
    </div>
  );
}