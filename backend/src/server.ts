import { server } from './app';
import connectDB from './config/db';
import { env } from './config/env';

// Flow:
// 1. connect database
// 2. start server
const PORT = process.env.PORT || env.port || 3000;
connectDB()
    .then(() => {
        server.listen(PORT, () => {
            console.log(`Server is running at port : ${PORT}`);
        });
    })
    .catch((err) => {
        console.log("MONGO db connection failed !!! ", err);
    });
