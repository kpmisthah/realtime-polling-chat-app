import React, { useEffect, useState, useRef } from 'react';
import { Send, MessageSquare, Users, Clock, CheckCheck, Pencil, Trash2, X, Check } from 'lucide-react';
import { socket } from '../socket';
import './Chat.css';

interface Message {
    id: string;
    username: string;
    text: string;
    timestamp: string;
    isEdited?: boolean;
    isDeleted?: boolean;
}

interface ChatProps {
    username: string;
}

const Chat: React.FC<ChatProps> = ({ username }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [typingUser, setTypingUser] = useState<string | null>(null);
    const [activeUsers, setActiveUsers] = useState(1);

    // New State for Edit/Settings
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const [isMuted, setIsMuted] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<number | undefined>(undefined);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, typingUser]);

    useEffect(() => {
        socket.on('receive_message', (data: any) => {
            setMessages((prev) => [...prev, {
                id: data.id,
                username: data.username || 'Anonymous',
                text: data.text,
                timestamp: data.timestamp,
                isEdited: data.isEdited,
                isDeleted: data.isDeleted
            }]);

            // Play notification sound if not muted and not own message
            if (!isMuted && data.username !== username) {
                // Simple beep or audio file. For now just browser console or visual is handled by state
                // To actually play sound we need an Audio element.
                // const audio = new Audio('/notification.mp3'); audio.play().catch(e => {}); 
            }
        });

        socket.on('message_updated', (data: { id: string, text: string, isEdited: boolean }) => {
            setMessages(prev => prev.map(msg =>
                msg.id === data.id ? { ...msg, text: data.text, isEdited: data.isEdited } : msg
            ));
        });

        socket.on('message_deleted', (data: { id: string }) => {
            setMessages(prev => prev.map(msg =>
                msg.id === data.id ? { ...msg, isDeleted: true, text: "This message was deleted" } : msg
            ));
        });

        socket.on('settings_updated', (settings: { notifications: boolean }) => {
            setIsMuted(!settings.notifications);
        });

        socket.on('display_typing', (data: any) => {
            setTypingUser(data.username || 'Someone');
        });

        socket.on('stop_display_typing', () => {
            setTypingUser(null);
        });

        socket.on('update_user_count', (count: number) => {
            setActiveUsers(count);
        });

        return () => {
            socket.off('receive_message');
            socket.off('message_updated');
            socket.off('message_deleted');
            socket.off('settings_updated');
            socket.off('display_typing');
            socket.off('stop_display_typing');
            socket.off('update_user_count');
        };
    }, [isMuted, username]);

    // Request history and settings on mount
    useEffect(() => {
        socket.emit('request_history');
        if (username) {
            socket.emit('get_settings', { username });
        }
    }, [username]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        socket.emit('send_message', { text: input, username: username });
        socket.emit('stop_typing');
        setInput('');
    };

    const handleInputString = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
        socket.emit('typing', { username });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = window.setTimeout(() => {
            socket.emit('stop_typing');
        }, 2000);
    };

    // New State for Delete Modal
    const [deleteModal, setDeleteModal] = useState<{ show: boolean, msgId: string | null }>({ show: false, msgId: null });

    // Edit/Delete Handlers
    const startEditing = (msg: Message) => {
        setEditingMessageId(msg.id);
        setEditText(msg.text);
    };

    const cancelEditing = () => {
        setEditingMessageId(null);
        setEditText('');
    };

    const saveEdit = () => {
        if (editingMessageId && editText.trim()) {
            socket.emit('edit_message', { id: editingMessageId, text: editText, username });
            setEditingMessageId(null);
            setEditText('');
        }
    };

    const requestDelete = (id: string) => {
        setDeleteModal({ show: true, msgId: id });
    };

    const confirmDelete = () => {
        if (deleteModal.msgId) {
            socket.emit('delete_message', { id: deleteModal.msgId, username });
            setDeleteModal({ show: false, msgId: null });
        }
    };

    const cancelDelete = () => {
        setDeleteModal({ show: false, msgId: null });
    };

    // Get user initials for avatar
    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    // Get consistent color for user
    const getUserColor = (name: string) => {
        const colors = [
            { from: '#3b82f6', to: '#9333ea' }, // Blue-Purple
            { from: '#ec4899', to: '#e11d48' }, // Pink-Rose
            { from: '#22c55e', to: '#059669' }, // Green-Emerald
            { from: '#f97316', to: '#d97706' }, // Orange-Amber
            { from: '#06b6d4', to: '#0d9488' }, // Cyan-Teal
            { from: '#8b5cf6', to: '#4f46e5' }, // Violet-Indigo
        ];
        const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
        return colors[index];
    };

    return (
        <div className="chat-container">
            <div className="chat-header">
                <div className="chat-header-top">
                    <div className="chat-title-group">
                        <div className="chat-icon-wrapper">
                            <MessageSquare size={22} />
                        </div>
                        <div>
                            <h2 className="chat-title">Live Chat</h2>
                            <p className="chat-subtitle">Connect with the community</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="message-count-badge">
                            {messages.length} {messages.length === 1 ? 'message' : 'messages'}
                        </div>
                    </div>
                </div>
                <div className="chat-stats">
                    <div className="chat-stat-item">
                        <Users size={14} />
                        <span>{activeUsers} Active now</span>
                    </div>
                    <span style={{ color: 'var(--border-color)' }}>•</span>
                    <div className="chat-stat-item">
                        <Clock size={14} />
                        <span>Real-time updates</span>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="messages-container">
                {messages.length === 0 && (
                    <div className="empty-chat-state">
                        <div className="empty-icon-wrapper">
                            <MessageSquare size={40} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <p className="empty-title">No messages yet</p>
                            <p className="empty-subtitle">Be the first to start the conversation!</p>
                        </div>
                    </div>
                )}

                {messages.map((msg) => {
                    const isOwn = msg.username === username;
                    const userColor = getUserColor(msg.username);
                    const isEditing = editingMessageId === msg.id;

                    return (
                        <div key={msg.id} className={`message-group ${isOwn ? 'own' : 'other'} ${msg.isDeleted ? 'deleted' : ''}`}>
                            {!isOwn && (
                                <div className="message-header">
                                    <div
                                        className="message-avatar"
                                        style={{
                                            '--gradient-from': userColor.from,
                                            '--gradient-to': userColor.to
                                        } as React.CSSProperties}
                                    >
                                        {getInitials(msg.username)}
                                    </div>
                                    <span className="message-username">{msg.username}</span>
                                </div>
                            )}
                            <div className="message-bubble-wrapper relative group">
                                <div className="message-bubble">
                                    {isEditing ? (
                                        <div className="edit-message-box">
                                            <input
                                                value={editText}
                                                onChange={(e) => setEditText(e.target.value)}
                                                autoFocus
                                                className="edit-message-input"
                                                onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                                            />
                                            <div className="edit-actions">
                                                <button onClick={saveEdit} className="edit-btn save"><Check size={14} /></button>
                                                <button onClick={cancelEditing} className="edit-btn cancel"><X size={14} /></button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {msg.text}
                                            {msg.isEdited && !msg.isDeleted && <span className="edited-label">(edited)</span>}
                                        </>
                                    )}
                                </div>

                                {/* Hover Actions for Own Messages */}
                                {isOwn && !msg.isDeleted && !isEditing && (
                                    <div className="message-actions">
                                        <button onClick={() => startEditing(msg)} className="action-btn edit" title="Edit">
                                            <Pencil size={12} />
                                        </button>
                                        <button onClick={() => requestDelete(msg.id)} className="action-btn delete" title="Delete">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="message-footer">
                                <Clock size={11} />
                                <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                {isOwn && <CheckCheck size={14} style={{ color: 'var(--primary)', marginLeft: '2px' }} />}
                            </div>
                        </div>
                    );
                })}

                {typingUser && (
                    <div className="typing-indicator-wrapper">
                        <div
                            className="message-avatar"
                            style={{
                                '--gradient-from': getUserColor(typingUser).from,
                                '--gradient-to': getUserColor(typingUser).to
                            } as React.CSSProperties}
                        >
                            {getInitials(typingUser)}
                        </div>
                        <div className="typing-indicator-bubble">
                            <span className="typing-user-name">{typingUser}</span>
                            <div className="typing-dots">
                                <div className="typing-dot"></div>
                                <div className="typing-dot"></div>
                                <div className="typing-dot"></div>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="chat-input-wrapper">
                <form onSubmit={handleSendMessage} className="chat-input-form">
                    <div className="input-container">
                        <input
                            type="text"
                            value={input}
                            onChange={handleInputString}
                            placeholder="Type your message..."
                            className="chat-input-field"
                            autoComplete="off"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!input.trim()}
                        className="send-button"
                        aria-label="Send message"
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>

            {/* Custom Delete Modal */}
            {deleteModal.show && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <div className="modal-icon warning">
                                <Trash2 size={24} />
                            </div>
                            <h3>Delete Message</h3>
                        </div>
                        <p className="modal-description">
                            Are you sure you want to delete this message? This action cannot be undone.
                        </p>
                        <div className="modal-actions">
                            <button onClick={cancelDelete} className="modal-btn cancel">Cancel</button>
                            <button onClick={confirmDelete} className="modal-btn delete">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chat;