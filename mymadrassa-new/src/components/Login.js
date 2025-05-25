import React, { useState } from 'react';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Vul alle velden in');
      return;
    }
    
    const success = onLogin({ email, password });
    
    if (!success) {
      setError('Ongeldige inloggegevens');
    }
  };

  return (
    <div className="login-container">
      <div className="login-sidebar">
        <div className="login-logo">
          <h1>MyMadrassa</h1>
          <p>Beheer je school eenvoudig en efficiënt</p>
        </div>
        <div>
          <h2>Welkom bij MyMadrassa</h2>
          <p>
            Het complete schoolbeheersysteem voor islamitische scholen. 
            Beheer studenten, leraren, klassen, aanwezigheid en meer.
          </p>
        </div>
      </div>
      <div className="login-form-container">
        <div className="login-form">
          <h1 className="login-title">Inloggen</h1>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">E-mailadres</label>
              <input
                type="email"
                id="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Voer je e-mailadres in"
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Wachtwoord</label>
              <input
                type="password"
                id="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Voer je wachtwoord in"
              />
            </div>
            <div className="form-group">
              <button type="submit" className="button" style={{ width: '100%' }}>
                Inloggen
              </button>
            </div>
            <div style={{ textAlign: 'center', marginTop: '15px' }}>
              <p>Testgegevens: admin@mymadrassa.be / admin123</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;