import { io } from 'socket.io-client';

// Use environment variable if available, otherwise default to localhost:3000
const getSocketUrl = (): string => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    try {
        // If it's a full URL, parse it to remove any path (e.g. /api/v1)
        // This is critical because socket.io expects the root URL, not the API sub-path.
        const urlObj = new URL(apiUrl);
        return urlObj.origin;
    } catch (e) {
        return apiUrl;
    }
};

const SOCKET_URL: string = getSocketUrl();

// 1. Singleton: This socket instance is created ONCE for the entire app
export const socket = io(SOCKET_URL, {
    autoConnect: false, // Prevents immediate connection. We control when to connect (in App.tsx)
    reconnectionAttempts: 3, // Retry connection 3 times if it fails
});
