import { io } from 'socket.io-client';

// Use environment variable if available, otherwise default to localhost:3000
const URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// 1. Singleton: This socket instance is created ONCE for the entire app
export const socket = io(URL, {
    autoConnect: false, // Prevents immediate connection. We control when to connect (in App.tsx)
    reconnectionAttempts: 3, // Retry connection 3 times if it fails
});
