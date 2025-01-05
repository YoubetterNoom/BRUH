import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const KeyGenerator: React.FC = () => {
  const [generatedKey, setGeneratedKey] = useState<string>('');
  const [savedKeys, setSavedKeys] = useState<string[]>([]);

  useEffect(() => {
    const keys = JSON.parse(localStorage.getItem('valid_keys') || '[]');
    setSavedKeys(keys);
  }, []);

  const generateKey = () => {
    const newKey = uuidv4().replace(/-/g, '').substring(0, 16).toUpperCase();
    setGeneratedKey(newKey);
  };

  const saveKey = () => {
    if (generatedKey) {
      const keys = [...savedKeys, generatedKey];
      localStorage.setItem('valid_keys', JSON.stringify(keys));
      setSavedKeys(keys);
      setGeneratedKey('');
    }
  };

  return (
    <div className="key-generator">
      <h2>Access Key Generator</h2>
      <div className="key-display">
        <input 
          type="text" 
          value={generatedKey} 
          readOnly 
          className="generated-key"
          placeholder="Generated key will appear here"
        />
        {generatedKey && (
          <>
            <button onClick={() => navigator.clipboard.writeText(generatedKey)} className="copy-button">
              Copy
            </button>
            <button onClick={saveKey} className="save-button">
              Save
            </button>
          </>
        )}
      </div>
      <button onClick={generateKey} className="generate-button">
        Generate New Key
      </button>
      <div className="saved-keys">
        <h3>Saved Keys ({savedKeys.length})</h3>
        <div className="keys-list">
          {savedKeys.map((key, index) => (
            <div key={index} className="key-item">
              {key}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KeyGenerator; 