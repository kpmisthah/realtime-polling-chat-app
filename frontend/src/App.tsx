import { useEffect, useState } from 'react';
import { Sun, Moon, Disc, MessageSquare, BarChart2, LogOut } from 'lucide-react';
import './App.css';
import { socket } from './socket';
import Chat from './components/Chat';
import Poll from './components/Poll';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [username, setUsername] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [activeTab, setActiveTab] = useState<'poll' | 'chat'>('poll'); // Mobile Tab State (poll | chat)

  // Theme Toggle Effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

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

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      setHasJoined(true);
      setActiveTab('poll'); // Default to Poll on join
    }
  };

  // --- Login Screen ---
  if (!hasJoined) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-[var(--bg-app)]">
        <div className="w-full max-w-sm p-6 bg-[var(--bg-panel)] rounded-xl border border-[var(--border-color)] shadow-xl animate-fade-in">
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="p-3 bg-[var(--primary)] bg-opacity-10 rounded-full">
              <Disc size={32} className="text-[var(--primary)]" />
            </div>
            <h1 className="text-2xl font-bold">Join Session</h1>
          </div>

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Display Name</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-color)] text-[var(--text-main)] focus:border-[var(--primary)] outline-none transition-colors"
                placeholder="e.g. Alex"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={!username.trim()}
              className="w-full p-3 rounded-lg bg-[var(--primary)] text-white font-semibold hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors"
            >
              Start
            </button>
          </form>
        </div>
        <button onClick={toggleTheme} className="absolute top-4 right-4 icon-btn">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    );
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
          <button onClick={() => setHasJoined(false)} className="icon-btn text-red-400 hover:text-red-500">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* 2. Content Area */}
      <div className="app-content">

        {/* Left Sidebar: Polls */}
        {/* On Mobile: Hidden if activeTab is 'chat' */}
        <aside className={`layout-sidebar ${activeTab === 'chat' ? 'hidden-mobile' : ''}`}>
          <div className="p-4 border-b border-[var(--border-color)] sticky top-0 bg-[var(--bg-panel)] z-10">
            <h2 className="font-semibold flex items-center gap-2">
              <BarChart2 size={18} className="text-[var(--primary)]" /> Active Poll
            </h2>
          </div>
          <div className="p-4">
            <Poll />
          </div>
        </aside>

        {/* Right Main: Chat */}
        {/* On Mobile: Hidden if activeTab is 'poll' */}
        <main className={`layout-main ${activeTab === 'poll' ? 'hidden-mobile' : ''}`}>
          <Chat username={username} />
        </main>

      </div>

      {/* Mobile Tab Bar (Only visible < 768px via CSS) */}
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

      {/* Global Style overrides for Mobile Tab Bar visibility */}
      <style>{`
        @media (min-width: 769px) {
          .mobile-tab-bar { display: none; }
          .mobile-hidden { display: flex !important; } /* Force show both on desktop */
        }
      `}</style>
    </div>
  );
}

export default App;
