import React, { useState, useEffect } from 'react';
import { socket } from '../socket';
import { BarChart2, Check, CheckCircle2, Loader2 } from 'lucide-react';
import './Poll.css';

interface PollOption {
    id: string;
    text: string;
    votes: number;
}

interface PollData {
    question: string;
    options: PollOption[];
    totalVotes: number;
}

const Poll: React.FC<{ username: string }> = ({ username }) => {
    const [poll, setPoll] = useState<PollData | null>(null);
    const [hasVoted, setHasVoted] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newQuestion, setNewQuestion] = useState('');
    const [newOptions, setNewOptions] = useState(['', '']);

    useEffect(() => {
        socket.on('update_poll', (data: PollData) => {
            // Only reset state if it's a completely NEW poll (different question)
            // Ideally, polls would have unique IDs to check against.
            setPoll(prevPoll => {
                const isNewPoll = prevPoll && prevPoll.question !== data.question;
                if (isNewPoll) {
                    setHasVoted(false);
                    setSelectedOption(null);
                    setIsCreating(false);
                    // Re-check status for the new poll just in case
                    socket.emit('check_poll_status', { username });
                }
                return data;
            });
        });

        socket.on('user_poll_status', (data: { hasVoted: boolean, optionId?: string }) => {
            setHasVoted(data.hasVoted);
            if (data.optionId) {
                setSelectedOption(data.optionId);
            }
        });

        const fetchData = () => {
            socket.emit('request_poll');
            if (username) {
                socket.emit('check_poll_status', { username });
            }
        };

        socket.on('connect', fetchData);

        // Initial fetch
        fetchData();

        return () => {
            socket.off('update_poll');
            socket.off('user_poll_status');
            socket.off('connect', fetchData);
        };
    }, [username]);

    const handleVote = (optionId: string) => {
        if (hasVoted) return;
        setSelectedOption(optionId);
        setHasVoted(true);
        socket.emit('vote', { optionId, username });
    };

    const handleAddOption = () => {
        if (newOptions.length < 5) setNewOptions([...newOptions, '']);
    };

    const handleRemoveOption = (index: number) => {
        if (newOptions.length > 2) {
            setNewOptions(newOptions.filter((_, i) => i !== index));
        }
    };

    const handleOptionChange = (index: number, value: string) => {
        const updated = [...newOptions];
        updated[index] = value;
        setNewOptions(updated);
    };

    const handleCreatePoll = (e: React.FormEvent) => {
        e.preventDefault();
        const validOptions = newOptions.filter(o => o.trim());
        if (newQuestion.trim() && validOptions.length >= 2) {
            socket.emit('create_poll', { question: newQuestion, options: validOptions });
            setNewQuestion('');
            setNewOptions(['', '']);
        }
    };

    if (isCreating) {
        return (
            <div className="poll-container">
                <div className="poll-header creation-mode">
                    <div className="poll-badge">
                        <BarChart2 size={14} />
                        <span>Create New Poll</span>
                    </div>
                    {/* Header Controls */}
                    <button
                        onClick={() => setIsCreating(false)}
                        className="poll-cancel-btn"
                    >
                        Cancel
                    </button>
                </div>

                <form onSubmit={handleCreatePoll} className="poll-creation-form">
                    <div className="poll-input-group">
                        <label>Question</label>
                        <textarea
                            value={newQuestion}
                            onChange={(e) => setNewQuestion(e.target.value)}
                            className="poll-input textarea"
                            placeholder="Type your question here..."
                            autoFocus
                            rows={2}
                        />
                    </div>

                    <div className="poll-input-group">
                        <label>Options</label>
                        <div className="poll-options-grid">
                            {newOptions.map((opt, i) => (
                                <div key={i} className="poll-option-row">
                                    <div className="poll-input-wrapper">
                                        <input
                                            value={opt}
                                            onChange={(e) => handleOptionChange(i, e.target.value)}
                                            className="poll-input"
                                            placeholder={`Option ${i + 1}`}
                                        />
                                    </div>
                                    {newOptions.length > 2 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveOption(i)}
                                            className="poll-remove-btn"
                                            title="Remove option"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        {newOptions.length < 5 && (
                            <button
                                type="button"
                                onClick={handleAddOption}
                                className="poll-add-btn"
                            >
                                + Add Option
                            </button>
                        )}
                    </div>

                    <div className="poll-actions">
                        <button
                            type="submit"
                            disabled={!newQuestion.trim() || newOptions.filter(o => o.trim()).length < 2}
                            className="poll-submit-btn"
                        >
                            Launch Poll
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    if (!poll) {
        return (
            <div className="poll-loading">
                <Loader2 className="animate-spin text-[var(--primary)]" size={32} />
                <p>Connecting to live poll...</p>
            </div>
        );
    }

    // Determine the max votes for relative calculations if needed, though simple % is usually enough.
    const maxVotes = Math.max(...poll.options.map(o => o.votes));

    return (
        <div className="poll-container">
            {/* Header */}
            <div className="poll-header relative group">
                <div className="poll-header-top">
                    <div className="poll-badge">
                        <BarChart2 size={14} />
                        <span>Live Poll</span>
                    </div>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="poll-create-btn"
                        title="Create New Poll"
                    >
                        <BarChart2 size={12} />
                        <span>New Poll</span>
                    </button>
                </div>
                <h2 className="poll-question">{poll.question}</h2>
                <div className="poll-meta">
                    {poll.totalVotes} {poll.totalVotes === 1 ? 'vote' : 'votes'} cast
                </div>
            </div>

            {/* Options List */}
            <div className="poll-options-list">
                {poll.options.map((option) => {
                    const percentage = poll.totalVotes > 0
                        ? Math.round((option.votes / poll.totalVotes) * 100)
                        : 0;

                    const isSelected = selectedOption === option.id;
                    const isLeader = poll.totalVotes > 0 && option.votes === maxVotes;

                    return (
                        <div
                            key={option.id}
                            onClick={() => !hasVoted && handleVote(option.id)}
                            className={`poll-option-card ${hasVoted ? 'disabled voted' : ''} ${isSelected ? 'selected' : ''} ${isLeader ? 'leader' : ''}`}
                            role="button"
                            aria-disabled={hasVoted}
                            tabIndex={hasVoted ? -1 : 0}
                        >
                            {/* Background Progress Bar */}
                            <div
                                className="poll-progress-bar"
                                style={{ width: `${percentage}%` }}
                            />

                            {/* Card Content */}
                            <div className="poll-card-content">
                                <div className="poll-option-info">
                                    <div className="poll-checkbox">
                                        {isSelected && <Check size={12} strokeWidth={4} color="white" />}
                                    </div>
                                    <span className="poll-option-text">{option.text}</span>
                                </div>
                                <span className="poll-percentage">
                                    {percentage}%
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Success Message */}
            {hasVoted && (
                <div className="vote-success-msg">
                    <CheckCircle2 size={16} />
                    <span>Vote submitted successfully!</span>
                </div>
            )}
        </div>
    );
};

export default Poll;
