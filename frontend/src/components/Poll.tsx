import React, { useState, useEffect } from 'react';
import { socket } from '../socket';
import { BarChart2, Check, CheckCircle2 } from 'lucide-react';
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

const Poll: React.FC = () => {
    const [poll, setPoll] = useState<PollData | null>(null);
    const [hasVoted, setHasVoted] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    useEffect(() => {
        socket.on('update_poll', (data: PollData) => {
            setPoll(data);
        });

        // Request initial poll data on mount
        socket.emit('request_poll');

        return () => { socket.off('update_poll'); };
    }, []);

    const handleVote = (optionId: string) => {
        if (hasVoted) return;
        setSelectedOption(optionId);
        setHasVoted(true);
        socket.emit('vote', { optionId });
    };

    if (!poll) {
        return (
            <div className="poll-loading">
                <div className="spinner"></div>
                <p>Connecting to live poll...</p>
            </div>
        );
    }

    // Determine the max votes for relative calculations if needed, though simple % is usually enough.
    const maxVotes = Math.max(...poll.options.map(o => o.votes));

    return (
        <div className="poll-container">
            {/* Header */}
            <div className="poll-header">
                <div className="poll-badge">
                    <BarChart2 size={14} />
                    <span>Live Poll</span>
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
