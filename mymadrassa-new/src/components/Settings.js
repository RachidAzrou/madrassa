import React, { useState, useEffect } from 'react';

function Settings({ appInfo }) {
  const [settings, setSettings] = useState({
    schoolName: 'MyMadrassa',
    language: 'nl',
    theme: 'light',
    notifications: true,
    autoBackup: true
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    alert('Instellingen opgeslagen!');
    // In een echte app zou je hier een API call doen om de instellingen op te slaan
  };

  return (
    <div className="settings-page">
      <h1>Instellingen</h1>
      
      <div className="card" style={{ marginBottom: '20px' }}>
        <h2>App Informatie</h2>
        <div>
          <p><strong>App Naam:</strong> {appInfo?.appName || 'MyMadrassa Desktop'}</p>
          <p><strong>Versie:</strong> {appInfo?.version || '1.0.0'}</p>
          {appInfo?.electronVersion && (
            <p><strong>Electron Versie:</strong> {appInfo.electronVersion}</p>
          )}
        </div>
      </div>
      
      <div className="card">
        <h2>Algemene Instellingen</h2>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label htmlFor="schoolName">Naam van de school</label>
            <input
              type="text"
              id="schoolName"
              name="schoolName"
              className="form-control"
              value={settings.schoolName}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="language">Taal</label>
            <select
              id="language"
              name="language"
              className="form-control"
              value={settings.language}
              onChange={handleChange}
            >
              <option value="nl">Nederlands</option>
              <option value="en">Engels</option>
              <option value="ar">Arabisch</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="theme">Thema</label>
            <select
              id="theme"
              name="theme"
              className="form-control"
              value={settings.theme}
              onChange={handleChange}
            >
              <option value="light">Licht</option>
              <option value="dark">Donker</option>
            </select>
          </div>
          
          <div className="form-group" style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              id="notifications"
              name="notifications"
              checked={settings.notifications}
              onChange={handleChange}
              style={{ marginRight: '10px' }}
            />
            <label htmlFor="notifications">Notificaties inschakelen</label>
          </div>
          
          <div className="form-group" style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              id="autoBackup"
              name="autoBackup"
              checked={settings.autoBackup}
              onChange={handleChange}
              style={{ marginRight: '10px' }}
            />
            <label htmlFor="autoBackup">Automatische backup</label>
          </div>
          
          <button type="submit" className="button">Instellingen opslaan</button>
        </form>
      </div>
      
      <div className="card" style={{ marginTop: '20px' }}>
        <h2>Database Instellingen</h2>
        <p>De database instellingen zijn alleen beschikbaar voor beheerders.</p>
        <p>Huidig database type: <strong>SQLite</strong> (lokaal)</p>
        
        <button className="button secondary" style={{ marginTop: '10px' }}>
          Database synchroniseren
        </button>
      </div>
    </div>
  );
}

export default Settings;