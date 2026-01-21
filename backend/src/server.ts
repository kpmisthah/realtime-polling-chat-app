import { server } from './app';
import connectDB from './config/db';
import { env } from './config/env';

// Flow:
// 1. connect database
// 2. start server

connectDB()
    .then(() => {
        server.listen(env.port, () => {
            console.log(`Server is running at port : ${env.port}`);
        });
    })
    .catch((err) => {
        console.log("MONGO db connection failed !!! ", err);
    });
