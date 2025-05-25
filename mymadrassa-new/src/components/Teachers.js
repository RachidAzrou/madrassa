import React, { useState, useEffect } from 'react';

function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simuleer het ophalen van docenten data
    const fetchTeachers = async () => {
      setLoading(true);
      try {
        // In een echte app zou dit een echte database query zijn
        const result = await window.electronAPI.executeQuery('SELECT * FROM teachers');
        
        // Voor nu gebruiken we voorbeelddata
        setTimeout(() => {
          setTeachers([
            { id: 1, teacherId: 'T001', firstName: 'Ibrahim', lastName: 'Najjar', subject: 'Arabisch', experience: '10 jaar' },
            { id: 2, teacherId: 'T002', firstName: 'Aisha', lastName: 'Benali', subject: 'Islamitische Studies', experience: '8 jaar' },
            { id: 3, teacherId: 'T003', firstName: 'Hassan', lastName: 'El Ouazzani', subject: 'Koran', experience: '15 jaar' },
            { id: 4, teacherId: 'T004', firstName: 'Fatima', lastName: 'Amrani', subject: 'Arabische Literatuur', experience: '6 jaar' },
          ]);
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error('Fout bij ophalen docenten:', error);
        setLoading(false);
      }
    };
    
    fetchTeachers();
  }, []);

  return (
    <div className="teachers-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Docenten</h1>
        <button className="button">Nieuwe Docent</button>
      </div>
      
      {loading ? (
        <div>Laden...</div>
      ) : (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Voornaam</th>
                <th>Achternaam</th>
                <th>Vak</th>
                <th>Ervaring</th>
                <th>Acties</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => (
                <tr key={teacher.id}>
                  <td>{teacher.teacherId}</td>
                  <td>{teacher.firstName}</td>
                  <td>{teacher.lastName}</td>
                  <td>{teacher.subject}</td>
                  <td>{teacher.experience}</td>
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

export default Teachers;