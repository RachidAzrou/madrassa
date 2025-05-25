import React, { useState, useEffect } from 'react';

function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Simuleer het ophalen van studenten data
    const fetchStudents = async () => {
      setLoading(true);
      try {
        // In een echte app zou je hier een API aanroep doen
        // Simuleer een database query via Electron
        const result = await window.electronAPI.executeQuery('SELECT * FROM students');
        
        // Voor nu gebruiken we dummy data
        setTimeout(() => {
          setStudents([
            { id: 1, studentId: 'S001', firstName: 'Ahmed', lastName: 'Youssef', grade: '8A', status: 'Actief' },
            { id: 2, studentId: 'S002', firstName: 'Fatima', lastName: 'El Amrani', grade: '7B', status: 'Actief' },
            { id: 3, studentId: 'S003', firstName: 'Mohammed', lastName: 'Ouahbi', grade: '9C', status: 'Actief' },
            { id: 4, studentId: 'S004', firstName: 'Layla', lastName: 'Bensouda', grade: '8A', status: 'Actief' },
            { id: 5, studentId: 'S005', firstName: 'Youssef', lastName: 'Tazi', grade: '7B', status: 'Inactief' },
          ]);
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error('Fout bij ophalen studenten:', error);
        setLoading(false);
      }
    };
    
    fetchStudents();
  }, []);

  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  return (
    <div className="students-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Studenten</h1>
        <button className="button">Nieuwe Student</button>
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
                <th>Klas</th>
                <th>Status</th>
                <th>Acties</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td>{student.studentId}</td>
                  <td>{student.firstName}</td>
                  <td>{student.lastName}</td>
                  <td>{student.grade}</td>
                  <td>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      backgroundColor: student.status === 'Actief' ? '#d1fae5' : '#fee2e2',
                      color: student.status === 'Actief' ? '#065f46' : '#b91c1c',
                      fontSize: '12px'
                    }}>
                      {student.status}
                    </span>
                  </td>
                  <td>
                    <button 
                      onClick={() => handleViewStudent(student)} 
                      className="button secondary" 
                      style={{ marginRight: '5px', padding: '5px 10px' }}
                    >
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
      
      {isModalOpen && selectedStudent && (
        <div className="modal" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 'var(--border-radius)',
            padding: '20px',
            maxWidth: '500px',
            width: '100%'
          }}>
            <h2>Student Details</h2>
            <div style={{ marginBottom: '15px' }}>
              <p><strong>ID:</strong> {selectedStudent.studentId}</p>
              <p><strong>Naam:</strong> {selectedStudent.firstName} {selectedStudent.lastName}</p>
              <p><strong>Klas:</strong> {selectedStudent.grade}</p>
              <p><strong>Status:</strong> {selectedStudent.status}</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="button secondary" onClick={() => setIsModalOpen(false)}>
                Sluiten
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Students;