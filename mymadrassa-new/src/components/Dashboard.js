import React, { useState, useEffect } from 'react';

function Dashboard({ dbConnected }) {
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    classes: 0,
    attendance: 0
  });

  useEffect(() => {
    // Simuleer het ophalen van statistieken (in een echte app zou dit data van een API ophalen)
    const fetchStats = async () => {
      try {
        // In een echte app zou je hier API-aanroepen doen
        if (dbConnected) {
          // Simuleer database query via Electron
          const studentsResult = await window.electronAPI.executeQuery('SELECT COUNT(*) FROM students');
          
          // Gebruik dummy data als voorbeeld
          setStats({
            students: 156,
            teachers: 12,
            classes: 8,
            attendance: 94
          });
        } else {
          // Toon demo data als er geen database verbinding is
          setStats({
            students: 156,
            teachers: 12,
            classes: 8,
            attendance: 94
          });
        }
      } catch (error) {
        console.error('Fout bij ophalen statistieken:', error);
      }
    };
    
    fetchStats();
  }, [dbConnected]);

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      
      {!dbConnected && (
        <div className="alert alert-warning">
          Let op: Er is geen verbinding met de database. Demo-gegevens worden weergegeven.
        </div>
      )}
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <span>👨‍🎓</span>
          </div>
          <div className="stat-content">
            <h3>Studenten</h3>
            <p>{stats.students}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <span>👨‍🏫</span>
          </div>
          <div className="stat-content">
            <h3>Docenten</h3>
            <p>{stats.teachers}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <span>🏫</span>
          </div>
          <div className="stat-content">
            <h3>Klassen</h3>
            <p>{stats.classes}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <span>📊</span>
          </div>
          <div className="stat-content">
            <h3>Aanwezigheid</h3>
            <p>{stats.attendance}%</p>
          </div>
        </div>
      </div>
      
      <div className="dashboard-charts">
        <div className="chart-card">
          <h2>Recente activiteit</h2>
          <div className="activity-list">
            <div className="activity-item">
              <p><strong>Vandaag, 10:15</strong> - Nieuwe student Ahmed Youssef toegevoegd</p>
            </div>
            <div className="activity-item">
              <p><strong>Vandaag, 09:30</strong> - Aanwezigheid geregistreerd voor Klas 8A</p>
            </div>
            <div className="activity-item">
              <p><strong>Gisteren, 15:45</strong> - Cijfers ingevoerd voor Arabische les</p>
            </div>
            <div className="activity-item">
              <p><strong>Gisteren, 14:20</strong> - Vergadering gepland met ouders op 15 mei</p>
            </div>
            <div className="activity-item">
              <p><strong>2 dagen geleden</strong> - Nieuwe docent Aisha Benali toegevoegd</p>
            </div>
          </div>
        </div>
        
        <div className="chart-card">
          <h2>Komende gebeurtenissen</h2>
          <div className="events-list">
            <div className="event-item">
              <p><strong>15 mei, 19:00</strong> - Ouderavond</p>
            </div>
            <div className="event-item">
              <p><strong>20 mei, 09:00</strong> - Toetsen Islamitische Studies</p>
            </div>
            <div className="event-item">
              <p><strong>1 juni, 10:00</strong> - Einde schooljaar viering</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;