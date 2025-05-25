import React from 'react';

function Header({ onLogout, appInfo }) {
  return (
    <header className="header">
      <h1 className="header-title">
        {/* Dynamische titel op basis van huidige pagina kan hier worden toegevoegd */}
        MyMadrassa
      </h1>
      
      <div className="header-actions">
        <div className="user-info">
          <span className="user-name">Admin</span>
          <div className="user-avatar">A</div>
        </div>
        
        <button onClick={onLogout} className="button secondary">
          Uitloggen
        </button>
      </div>
    </header>
  );
}

export default Header;