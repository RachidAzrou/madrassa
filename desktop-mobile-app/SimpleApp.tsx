import React from 'react';

// Zeer eenvoudige versie om te testen
const SimpleApp = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#f5f5f5',
      padding: 20,
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{
        fontSize: 28,
        color: '#1e3a8a',
        marginBottom: 20
      }}>
        MyMadrassa Desktop App
      </h1>
      <p style={{
        fontSize: 18,
        color: '#444',
        textAlign: 'center',
        maxWidth: 600,
        lineHeight: 1.5
      }}>
        Welkom bij de MyMadrassa desktop applicatie. Dit is een vereenvoudigde versie
        om te controleren of de basis app correct werkt.
      </p>
      <div style={{
        marginTop: 40,
        display: 'flex',
        flexDirection: 'column',
        gap: 15
      }}>
        <button style={{
          padding: '12px 24px',
          backgroundColor: '#1e3a8a',
          color: 'white',
          border: 'none',
          borderRadius: 4,
          fontSize: 16,
          cursor: 'pointer'
        }}>
          Login
        </button>
        <button style={{
          padding: '12px 24px',
          backgroundColor: '#f0f0f0',
          color: '#333',
          border: '1px solid #ddd',
          borderRadius: 4,
          fontSize: 16,
          cursor: 'pointer'
        }}>
          Instellingen
        </button>
      </div>
    </div>
  );
};

export default SimpleApp;