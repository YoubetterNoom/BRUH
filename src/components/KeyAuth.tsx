import React, { useState } from 'react';

interface KeyAuthProps {
  onAuthenticated: () => void;
}

const KeyAuth: React.FC<KeyAuthProps> = ({ onAuthenticated }) => {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');

  const validKeys = [
    ...JSON.parse(localStorage.getItem('valid_keys') || '[]'),
    'STEALTH',
    'CARLO'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validKeys.includes(key.toUpperCase())) {
      localStorage.setItem('auth_key', key.toUpperCase());
      onAuthenticated();
    } else {
      setError('Invalid key');
    }
  };

  return (
    <div className="key-auth">
      <h2>Enter Access Key</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={key}
          onChange={(e) => {
            setKey(e.target.value);
            setError('');
          }}
          placeholder="Enter your access key"
          className="key-input"
          maxLength={16}
        />
        {error && <p className="error-message">{error}</p>}
        <button 
          type="submit" 
          className="submit-button"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default KeyAuth; 