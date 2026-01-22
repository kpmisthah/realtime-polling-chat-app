import { useEffect, useState } from 'react';
import { Sun, Moon, MessageSquare, BarChart2, LogOut } from 'lucide-react';
import './App.css';
import { socket } from './socket';
import Chat from './components/Chat';
import Poll from './components/Poll';
import Auth from './components/Auth';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [username, setUsername] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [activeTab, setActiveTab] = useState<'poll' | 'chat'>('poll'); // Mobile Tab State

  // Theme Toggle Effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Check for existing session
  useEffect(() => {
    const storedUser = localStorage.getItem('chat_username');
    const storedToken = localStorage.getItem('chat_access_token');

    if (storedUser && storedToken) {
      setUsername(storedUser);
      setHasJoined(true);
    }
  }, []);

  // Socket Connection
  useEffect(() => {
    function onConnect() { setIsConnected(true); }
    function onDisconnect() { setIsConnected(false); }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.connect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.disconnect();
    };
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleLogin = (user: string, accessToken: string) => {
    setUsername(user);
    setHasJoined(true);
    setActiveTab('poll');
    // Persist session
    localStorage.setItem('chat_username', user);
    localStorage.setItem('chat_access_token', accessToken);
  };

  const handleLogout = () => {
    setHasJoined(false);
    setUsername('');
    localStorage.removeItem('chat_username');
    localStorage.removeItem('chat_access_token');
  };

  // --- Login Screen ---
  if (!hasJoined) {
    return <Auth onLogin={handleLogin} />;
  }

  // --- Main App Interface ---
  return (
    <div className="app-container">

      {/* 1. Header */}
      <header className="app-header">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <h1 className="font-bold text-lg tracking-tight">RealTime<span className="text-[var(--primary)]">Hub</span></h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium hidden sm:block">{username}</span>
          <button onClick={toggleTheme} className="icon-btn">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button onClick={handleLogout} className="icon-btn text-red-400 hover:text-red-500">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* 2. Content Area */}
      <div className="app-content">

        {/* Left Sidebar: Polls */}
        <aside className={`layout-sidebar ${activeTab === 'chat' ? 'hidden-mobile' : ''}`}>
          <div className="p-4 border-b border-[var(--border-color)] sticky top-0 bg-[var(--bg-panel)] z-10">
            <h2 className="font-semibold flex items-center gap-2">
              <BarChart2 size={18} className="text-[var(--primary)]" /> Active Poll
            </h2>
          </div>
          <div className="p-4">
            <Poll username={username} />
          </div>
        </aside>

        {/* Right Main: Chat */}
        <main className={`layout-main ${activeTab === 'poll' ? 'hidden-mobile' : ''}`}>
          <Chat username={username} />
        </main>

      </div>

      {/* Mobile Tab Bar */}
      <div className="md:hidden mobile-tab-bar">
        <button
          onClick={() => setActiveTab('poll')}
          className={`flex flex-col items-center gap-1 p-2 flex-1 rounded-lg transition-colors ${activeTab === 'poll' ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}
        >
          <BarChart2 size={24} />
          <span className="text-xs font-medium">Polls</span>
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex flex-col items-center gap-1 p-2 flex-1 rounded-lg transition-colors ${activeTab === 'chat' ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}
        >
          <MessageSquare size={24} />
          <span className="text-xs font-medium">Chat</span>
        </button>
      </div>

      <style>{`
        @media (min-width: 769px) {
          .mobile-tab-bar { display: none; }
          .mobile-hidden { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

export default App;
