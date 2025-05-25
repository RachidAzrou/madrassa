import React from 'react';
import { NavLink } from 'react-router-dom';

function Sidebar() {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-title">MyMadrassa</h1>
      </div>
      
      <ul className="sidebar-menu">
        <li>
          <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="sidebar-menu-icon">📊</span>
            Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink to="/students" className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="sidebar-menu-icon">👨‍🎓</span>
            Studenten
          </NavLink>
        </li>
        <li>
          <NavLink to="/teachers" className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="sidebar-menu-icon">👨‍🏫</span>
            Docenten
          </NavLink>
        </li>
        <li>
          <NavLink to="/classes" className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="sidebar-menu-icon">🏫</span>
            Klassen
          </NavLink>
        </li>
        <li>
          <NavLink to="/settings" className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="sidebar-menu-icon">⚙️</span>
            Instellingen
          </NavLink>
        </li>
      </ul>
      
      <div style={{ padding: '20px', marginTop: 'auto' }}>
        <div className="sidebar-version" style={{ fontSize: '12px', opacity: 0.7 }}>
          MyMadrassa Desktop App<br />
          Versie 1.0.0
        </div>
      </div>
    </div>
  );
}

export default Sidebar;