import mongoose from 'mongoose';
import { env } from './env';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(env.mongoUri);
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Fix for "duplicate key error collection: test.users index: email_1"
        // Since we don't use email field, we must remove this legacy index if it exists.
        try {
            await mongoose.connection.collection('users').dropIndex('email_1');
            console.log('Dropped legacy index: email_1 from users collection');
        } catch (err: any) {
            // Ignore error if index doesn't exist (code 27)
            if (err.code !== 27) {
                console.log('Note: Attempted to drop email_1 index but failed (likely did not exist):', err.message);
            }
        }
    } catch (error) {
        console.error(`Error: ${(error as Error).message}`);
        process.exit(1);
    }
};

export default connectDB;
