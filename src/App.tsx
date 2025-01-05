import React, { useState, useEffect } from 'react';
import './App.css';
import TransactionMonitor from './components/TransactionMonitor';
import KeyAuth from './components/KeyAuth';
import KeyGenerator from './components/KeyGenerator';

const ADMIN_KEY = 'STEALTH'; // 更改管理员密钥为 STEALTH

function App() {
  const [programId, setProgramId] = useState('');
  const [debouncedProgramId, setDebouncedProgramId] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'G') {
      const adminKey = prompt('Enter admin key to access generator:');
      if (adminKey === ADMIN_KEY) {
        setShowGenerator(true);
      }
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  useEffect(() => {
    const authKey = localStorage.getItem('auth_key');
    if (authKey) {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (programId && programId.length >= 32) {
        setDebouncedProgramId(programId);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [programId]);

  if (!isAuthenticated) {
    return (
      <div className="App">
        <header className="App-header">
          <h1>Stealth Tool Pack</h1>
          <p className="subtitle">Advanced Solana Program Monitoring</p>
        </header>
        <KeyAuth onAuthenticated={() => setIsAuthenticated(true)} />
        {/* 只在特定条件下显示生成器 */}
        {showGenerator && <KeyGenerator />}
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Stealth Tool Pack</h1>
        <p className="subtitle">Advanced Solana Program Monitoring</p>
      </header>
      <main>
        <div className="program-input-container">
          <div className="input-wrapper">
            <input
              type="text"
              placeholder="Enter Program ID"
              value={programId}
              onChange={(e) => setProgramId(e.target.value)}
              className="program-input"
            />
            <div className="input-border"></div>
          </div>
          <p className="input-hint">Enter a Solana program ID to start monitoring</p>
        </div>
        {debouncedProgramId && <TransactionMonitor programId={debouncedProgramId} />}
      </main>
    </div>
  );
}

export default App; 