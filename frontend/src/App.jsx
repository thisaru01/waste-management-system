import { useEffect, useState } from 'react';
import { checkBackend } from './services/api';

function App() {
  const [message, setMessage] = useState('Loading...');

  useEffect(() => {
    checkBackend()
      .then(data => setMessage(data.message))
      .catch(() => setMessage('❌ Failed to connect to backend'));
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Waste Management System</h1>
      <p>{message}</p>
    </div>
  );
}

export default App;