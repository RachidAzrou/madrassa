import React, { useState, useEffect } from 'react';

function Classes() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Haal klassen data op
    const fetchClasses = async () => {
      setLoading(true);
      try {
        // In een echte app zou dit een API aanroep doen
        const result = await window.electronAPI.executeQuery('SELECT * FROM classes');
        
        // Voor demonstratie doeleinden
        setTimeout(() => {
          setClasses([
            { id: 1, name: '7A', teacher: 'Ibrahim Najjar', subject: 'Arabisch', students: 22, time: 'Ma 09:00 - 10:30' },
            { id: 2, name: '8B', teacher: 'Aisha Benali', subject: 'Islamitische Studies', students: 18, time: 'Di 11:00 - 12:30' },
            { id: 3, name: '9C', teacher: 'Hassan El Ouazzani', subject: 'Koran', students: 20, time: 'Wo 09:00 - 10:30' },
            { id: 4, name: '7B', teacher: 'Fatima Amrani', subject: 'Arabische Literatuur', students: 24, time: 'Do 13:00 - 14:30' },
          ]);
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error('Fout bij ophalen klassen:', error);
        setLoading(false);
      }
    };
    
    fetchClasses();
  }, []);

  return (
    <div className="classes-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Klassen</h1>
        <button className="button">Nieuwe Klas</button>
      </div>
      
      {loading ? (
        <div>Laden...</div>
      ) : (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Naam</th>
                <th>Docent</th>
                <th>Vak</th>
                <th>Aantal Leerlingen</th>
                <th>Tijdstip</th>
                <th>Acties</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((cls) => (
                <tr key={cls.id}>
                  <td>{cls.name}</td>
                  <td>{cls.teacher}</td>
                  <td>{cls.subject}</td>
                  <td>{cls.students}</td>
                  <td>{cls.time}</td>
                  <td>
                    <button className="button secondary" style={{ marginRight: '5px', padding: '5px 10px' }}>
                      Bekijken
                    </button>
                    <button className="button secondary" style={{ padding: '5px 10px' }}>
                      Bewerken
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Classes;