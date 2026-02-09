import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuilding, faPercent, faSave, faPalette } from '@fortawesome/free-solid-svg-icons';

export default function Settings({ theme, setTheme, showToast }) {
  const [activeSection, setActiveSection] = useState('company');
  const [company, setCompany] = useState({
    name: 'YAMES MINIMART',
    address: '123 Main Street, Accra',
    location: 'Opposite Main Market',
    phone: '020 123 4567',
    footer: 'THANK YOU FOR SHOPPING WITH US!!'
  });

  const [taxConfig, setTaxConfig] = useState({
    rate: 18,
    enabled: false
  });

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 'bold',
    fontSize: '14px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase'
  };

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('minimart_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCompany(parsed);
        if (parsed.taxConfig) {
          setTaxConfig(parsed.taxConfig);
        }
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  const handleSaveSettings = () => {
    const data = { ...company, taxConfig };
    localStorage.setItem('minimart_settings', JSON.stringify(data));
    showToast('Settings Saved Successfully!');
  };

  // Common Styles
  const textColor = 'var(--text-color)';
  const labelColor = 'var(--text-color)';
  const iconColor = 'var(--text-color)';

  // Wrapper style to constrain content to 1/3 width and align left
  const contentContainerStyle = {
    width: '33.33%',
    alignSelf: 'flex-start',
    display: 'flex',
    flexDirection: 'column',
    gap: '25px'
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '20px', overflow: 'hidden' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexShrink: 0 }}>
        <h2 style={{ margin: 0, color: textColor, fontSize: '24px', fontWeight: 'bold' }}>System Settings</h2>
        <button
          onClick={handleSaveSettings}
          className="glass-btn"
          style={{
            padding: '12px 24px',
            background: 'var(--success-bg)',
            borderColor: 'var(--success)',
            color: 'var(--text-success)',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          <FontAwesomeIcon icon={faSave} style={{ marginRight: '8px', }} />
          SAVE ALL
        </button>
      </div>

      {/* BODY: VERTICAL LAYOUT */}
      <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: '20px', overflow: 'hidden' }}>
        
        {/* TOP: NAVIGATION */}
        <div className="glass-panel" style={{ 
          display: 'flex', 
          flexDirection: 'row', 
          padding: '10px',
          gap: '10px',
          flexShrink: 0
        }}>
          <button
            onClick={() => setActiveSection('company')}
            className={`glass-btn ${activeSection === 'company' ? 'active-tab' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 20px',
              fontSize: '16px', 
              background: activeSection === 'company' ? 'var(--glass-btn-hover-bg)' : 'transparent',
              border: 'none',
              color: activeSection === 'company' ? textColor : iconColor,
              flex: 1,
              justifyContent: 'center'
            }}
          >
            <FontAwesomeIcon icon={faBuilding} style={{width: '20px', color: activeSection === 'company' ? textColor : iconColor }} />
            <span style={{ fontWeight: 'bold' }}>Company Details</span>
          </button>

          <button
            onClick={() => setActiveSection('tax')}
            className={`glass-btn ${activeSection === 'tax' ? 'active-tab' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 20px',
              fontSize: '16px', 
              background: activeSection === 'tax' ? 'var(--glass-btn-hover-bg)' : 'transparent',
              border: 'none',
              color: activeSection === 'tax' ? textColor : iconColor,
              flex: 1,
              justifyContent: 'center'
            }}
          >
            <FontAwesomeIcon icon={faPercent} style={{width: '20px', color: activeSection === 'tax' ? textColor : iconColor }} />
            <span style={{ fontWeight: 'bold' }}>Tax & Pricing</span>
          </button>

          <button
            onClick={() => setActiveSection('appearance')}
            className={`glass-btn ${activeSection === 'appearance' ? 'active-tab' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 20px',
              fontSize: '16px',
              background: activeSection === 'appearance' ? 'var(--glass-btn-hover-bg)' : 'transparent',
              border: 'none',
              color: activeSection === 'appearance' ? textColor : iconColor,
              flex: 1,
              justifyContent: 'center'
            }}
          >
            <FontAwesomeIcon icon={faPalette} style={{width: '20px', color: activeSection === 'appearance' ? textColor : iconColor }} />
            <span style={{ fontWeight: 'bold' }}>Appearance</span>
          </button>
        </div>

        {/* RIGHT: CONTENT AREA */}
        <div className="glass-panel" style={{ flex: 1, padding: '30px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          
          {/* --- SECTION: COMPANY --- */}
          {activeSection === 'company' && (
            <div style={contentContainerStyle}>
              <h3 style={{ 
                marginTop: 0, 
                borderBottom: '1px solid var(--glass-border)', 
                paddingBottom: '10px',
                color: textColor,
                fontSize: '22px'
              }}>
                Store Information
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
                {['name', 'address', 'location', 'phone', 'footer'].map((field) => (
                  <div key={field}>
                    <label style={{...labelStyle, color: labelColor}}>
                      {field === 'footer' ? 'Receipt Footer' : `Store ${field.charAt(0).toUpperCase() + field.slice(1)}`}
                    </label>
                    
                    {field === 'footer' ? (
                      <textarea
                        className="glass-input"
                        style={{ fontSize: '18px', resize: 'none', width: '100%' }}
                        rows="3"
                        value={company.footer}
                        onChange={(e) => setCompany({ ...company, footer: e.target.value })}
                        placeholder="Text at bottom of receipt..."
                      />
                    ) : (
                      <input
                        className="glass-input"
                        style={{ fontSize: '18px', width: '100%' }}
                        value={company[field]}
                        onChange={(e) => setCompany({ ...company, [field]: e.target.value })}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* LIVE PREVIEW CARD */}
              <div style={{ 
                background: 'white', 
                color: 'black', 
                padding: '25px', 
                borderRadius: '8px', 
                fontFamily: 'monospace', 
                border: '4px solid var(--glass-border)',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                width: '100%',
                alignSelf: 'flex-start'
              }}>
                <div style={{ textAlign: 'center', marginBottom: '20px', textTransform: 'uppercase', fontWeight: 'bold', fontSize: '20px', color: '#111827' }}>
                  {company.name}
                </div>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#111827' }}>{company.address}</p>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#111827' }}>{company.location}</p>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#111827' }}>{company.phone}</p>
                <div style={{ margin: '20px 0', borderTop: '1px dashed #000', paddingTop: '15px', fontSize: '16px', fontStyle: 'italic', textAlign: 'center', color: '#555' }}>
                  {company.footer}
                </div>
              </div>
            </div>
          )}

          {/* --- SECTION: TAX --- */}
          {activeSection === 'tax' && (
            <div style={contentContainerStyle}>
              <h3 style={{ 
                marginTop: 0, 
                borderBottom: '1px solid var(--glass-border)', 
                paddingBottom: '10px',
                color: textColor,
                fontSize: '22px'
              }}>
                Tax & Pricing Configuration
              </h3>
              
              {/* Wrapper for tax controls to ensure they follow the width constraint */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', width: '100%' }}>
                
                {/* ENABLE TOGGLE */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '20px', 
                  background: 'var(--glass-btn-bg)', 
                  borderRadius: '8px',
                  border: '1px solid var(--glass-border)',
                  width: '100%'
                }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '18px', color: textColor }}>Enable VAT / GST</div>
                    <small style={{ opacity: 0.6, fontSize: '14px', color: labelColor }}>Calculates tax at checkout</small>
                  </div>
                  
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={taxConfig.enabled}
                      onChange={(e) => setTaxConfig({ ...taxConfig, enabled: e.target.checked })}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                {/* RATE INPUT */}
                <div style={{ width: '100%' }}>
                  <label style={{...labelStyle, color: labelColor}}>
                    Global Tax Rate (%)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <input
                      type="number"
                      className="glass-input"
                      style={{ 
                        fontSize: '24px', 
                        padding: '10px', 
                        width: '150px', 
                        textAlign: 'center',
                        fontWeight: 'bold'
                      }}
                      value={taxConfig.rate}
                      onChange={(e) => setTaxConfig({ ...taxConfig, rate: parseFloat(e.target.value) })}
                      disabled={!taxConfig.enabled}
                    />
                    <span style={{ fontSize: '24px', fontWeight: 'bold', color: textColor }}>%</span>
                  </div>
                  <small style={{ opacity: 0.6, marginTop: '5px', display: 'block', color: labelColor }}>Applied to all items at checkout</small>
                </div>
              </div>
            </div>
          )}

          {/* --- SECTION: APPEARANCE --- */}
          {activeSection === 'appearance' && (
            <div style={contentContainerStyle}>
              <h3 style={{ 
                marginTop: 0, 
                borderBottom: '1px solid var(--glass-border)', 
                paddingBottom: '10px',
                color: textColor,
                fontSize: '22px'
              }}>
                Display & Appearance
              </h3>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '20px', 
                background: 'var(--glass-btn-bg)', 
                borderRadius: '8px',
                border: '1px solid var(--glass-border)',
                width: '100%',
                alignSelf: 'flex-start'
              }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '18px', color: textColor }}>White Theme</div>
                  <small style={{ opacity: 0.6, fontSize: '14px', color: labelColor }}>Switch between dark and light modes</small>
                </div>
                
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={theme === 'light'}
                    onChange={(e) => setTheme(e.target.checked ? 'light' : 'dark')}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}