import { Server, Socket } from 'socket.io';
import { MessageModel } from '../modules/chat/chat.model';
import { PollModel } from '../modules/poll/poll.model';

export const setupSocketIO = (io: Server) => {

    // --- Persistence Helper: Get or Create Active Poll ---
    const getActivePoll = async () => {
        let poll = await PollModel.findOne({ active: true });
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

    io.on('connection', async (socket: Socket) => {
        console.log('A user connected:', socket.id);

        // 1. Send recent chat history
        const messages = await MessageModel.find().sort({ timestamp: 1 }).limit(50);
        // Map to frontend format if needed, but our schema matches mostly
        messages.forEach(msg => {
            socket.emit('receive_message', {
                id: msg._id.toString(), // Use Mongo ID
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

        socket.on('vote', async (data: { optionId: string }) => {
            const poll = await getActivePoll();
            const option = poll.options.find(opt => opt.id === data.optionId);

            if (option) {
                option.votes++;
                await poll.save(); // Persist to DB

                // Broadcast updated poll
                io.emit('update_poll', {
                    question: poll.question,
                    options: poll.options,
                    totalVotes: poll.options.reduce((acc, opt) => acc + opt.votes, 0)
                });
            }
        });
    });
};
