import { Server, Socket } from 'socket.io';

export const setupSocketIO = (io: Server) => {

    // --- In-Memory Poll Data (Simple Implementation) ---
    // In a real app, this would come from the MongoDB database
    let currentPoll = {
        question: "What is your favorite programming language?",
        options: [
            { id: "1", text: "JavaScript / TypeScript", votes: 0 },
            { id: "2", text: "Python", votes: 0 },
            { id: "3", text: "Rust", votes: 0 },
            { id: "4", text: "Go", votes: 0 }
        ]
    };

    io.on('connection', (socket: Socket) => {
        console.log('A user connected:', socket.id);

        // 1. Send current poll state to the NEW user
        socket.emit('update_poll', {
            question: currentPoll.question,
            options: currentPoll.options,
            totalVotes: currentPoll.options.reduce((acc, opt) => acc + opt.votes, 0)
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });

        // --- Chat Events ---
        socket.on('send_message', (data) => {
            io.emit('receive_message', { ...data, id: socket.id, timestamp: new Date() });
        });

        socket.on('typing', (data) => {
            socket.broadcast.emit('display_typing', { ...data, id: socket.id });
        });

        socket.on('stop_typing', () => {
            socket.broadcast.emit('stop_display_typing', { id: socket.id });
        });

        // --- Polling Events ---
        socket.on('request_poll', () => {
            socket.emit('update_poll', {
                question: currentPoll.question,
                options: currentPoll.options,
                totalVotes: currentPoll.options.reduce((acc, opt) => acc + opt.votes, 0)
            });
        });

        socket.on('vote', (data: { optionId: string }) => {
            const option = currentPoll.options.find(opt => opt.id === data.optionId);
            if (option) {
                option.votes++;

                // Broadcast updated poll to EVERYONE
                io.emit('update_poll', {
                    question: currentPoll.question,
                    options: currentPoll.options,
                    totalVotes: currentPoll.options.reduce((acc, opt) => acc + opt.votes, 0)
                });
            }
        });
    });



};
