import { Server, Socket } from 'socket.io';
import { MessageModel } from '../modules/chat/chat.model';
import { PollModel } from '../modules/poll/poll.model';

export const setupSocketIO = async (io: Server) => {

    // --- Persistence Helper: Get or Create Active Poll ---
    const getActivePoll = async () => {
        let poll = await PollModel.findOne({ active: true }).sort({ _id: -1 });
        if (!poll) {
            poll = await PollModel.create({
                question: "What is your favorite programming language?",
                options: [
                    { id: "1", text: "JavaScript / TypeScript", votes: 0 },
                    { id: "2", text: "Python", votes: 0 },
                    { id: "3", text: "Rust", votes: 0 },
                    { id: "4", text: "Go", votes: 0 }
                ],
                active: true
            });
        }
        return poll;
    };

    // Track connected users
    const connectedUsers = new Map<string, string>();

    io.on('connection', async (socket: Socket) => {
        console.log('A user connected:', socket.id);

        // Handle user info (simplified for now, just counting sockets)
        connectedUsers.set(socket.id, 'Anonymous');
        io.emit('update_user_count', connectedUsers.size);

        // 1. Send recent chat history
        const messages = await MessageModel.find().sort({ timestamp: 1 }).limit(50);
        messages.forEach(msg => {
            socket.emit('receive_message', {
                id: msg._id.toString(),
                text: msg.text,
                username: msg.username,
                timestamp: msg.timestamp
            });
        });

        // 2. Send current polls
        const poll = await getActivePoll();
        socket.emit('update_poll', {
            question: poll.question,
            options: poll.options,
            totalVotes: poll.options.reduce((acc, opt) => acc + opt.votes, 0)
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
            connectedUsers.delete(socket.id);
            io.emit('update_user_count', connectedUsers.size);
        });

        // --- Chat Events ---
        socket.on('send_message', async (data) => {
            // Save to DB
            const newMessage = await MessageModel.create({
                username: data.username,
                text: data.text,
                timestamp: new Date()
            });

            // Broadcast to all
            io.emit('receive_message', {
                id: newMessage._id.toString(),
                username: newMessage.username,
                text: newMessage.text,
                timestamp: newMessage.timestamp
            });
        });

        socket.on('typing', (data) => {
            socket.broadcast.emit('display_typing', { ...data, id: socket.id });
        });

        socket.on('stop_typing', () => {
            socket.broadcast.emit('stop_display_typing', { id: socket.id });
        });

        // --- Polling Events ---
        socket.on('request_poll', async () => {
            const poll = await getActivePoll();
            socket.emit('update_poll', {
                question: poll.question,
                options: poll.options,
                totalVotes: poll.options.reduce((acc, opt) => acc + opt.votes, 0)
            });
        });

        socket.on('vote', async (data: { optionId: string, username: string }) => {
            const poll = await getActivePoll();
            const { optionId, username } = data;

            // Check if user already voted in this session
            // Using username for persistence across refreshes
            // @ts-ignore - Schema updated but Types might be lagging in IDE check
            if (poll.votedBy.some((v: any) => v.user === username)) {
                return;
            }

            const option = poll.options.find(opt => opt.id === optionId);

            if (option) {
                option.votes++;
                // @ts-ignore
                poll.votedBy.push({ user: username, optionId }); // Mark as voted by username
                await poll.save(); // Persist to DB

                // Broadcast updated poll
                io.emit('update_poll', {
                    question: poll.question,
                    options: poll.options,
                    totalVotes: poll.options.reduce((acc, opt) => acc + opt.votes, 0)
                });

                // Confirm to sender
                socket.emit('user_poll_status', { hasVoted: true, optionId });
            }
        });

        socket.on('check_poll_status', async (data: { username: string }) => {
            const poll = await getActivePoll();
            // @ts-ignore
            const voteRecord = poll.votedBy.find((v: any) => v.user === data.username);

            if (voteRecord) {
                socket.emit('user_poll_status', { hasVoted: true, optionId: voteRecord.optionId });
            } else {
                socket.emit('user_poll_status', { hasVoted: false });
            }
        });

        // --- Create New Poll ---
        socket.on('create_poll', async (data: { question: string, options: string[] }) => {
            // 1. Deactivate old polls
            await PollModel.updateMany({ active: true }, { active: false });

            // 2. Create new poll
            const newPoll = await PollModel.create({
                question: data.question,
                options: data.options.map((opt, index) => ({
                    id: (index + 1).toString(),
                    text: opt,
                    votes: 0
                })),
                active: true
            });

            // 3. Broadcast to everyone
            io.emit('update_poll', {
                question: newPoll.question,
                options: newPoll.options,
                totalVotes: 0
            });
        });
    });
};
