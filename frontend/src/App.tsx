import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Activity, Wifi, WifiOff } from 'lucide-react';
import './App.css';

// Initialize socket outside component to prevent multiple connections
// or use useMemo/useRef inside. For simplicity in this demo, inside useEffect is fine 
// but defining URL here.
const SOCKET_URL = 'http://localhost:5000';

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // Connect to the backend
    const newSocket = io(SOCKET_URL);

    newSocket.on('connect', () => {
      setIsConnected(true);
      setSocketId(newSocket.id || '');
      addLog(`Connected with ID: ${newSocket.id}`);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      setSocketId('');
      addLog('Disconnected from server');
    });

    newSocket.on('connect_error', (err) => {
      addLog(`Connection Error: ${err.message}`);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, []);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `> ${msg}`].slice(-10)); // Keep last 10 logs
  };

  return (
    <div className="app-container">
      <div className="card">
        <div className="header">
          <h1>Real-time Hub</h1>
          <Activity className="icon-pulse" size={24} color="var(--accent-color)" />
        </div>

        <p className="subtitle">System Status Monitor</p>

        <div className={`status-badge ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
          <span>{isConnected ? 'System Online' : 'Connecting...'}</span>
        </div>

        {isConnected && (
          <div className="info-row">
            <span className="label">Socket ID:</span>
            <span className="value monospace">{socketId}</span>
          </div>
        )}

        <div className="logs-container">
          <p className="logs-title">Event Logs</p>
          <div className="logs-window">
            {logs.length === 0 ? (
              <span className="placeholder">Waiting for events...</span>
            ) : (
              logs.map((log, i) => <div key={i}>{log}</div>)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
