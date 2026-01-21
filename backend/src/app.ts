import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import authRouter from './modules/auth/auth.routes';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Adjust this for production
    }
});

app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use(helmet());

// Load routes here
app.use('/api/v1/auth', authRouter);
// app.use('/api/v1/users', userRouter);

export { app, server, io };
