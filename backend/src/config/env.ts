import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
    port: process.env.PORT || 5000,
    mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/template',
    jwtSecret: process.env.JWT_SECRET || 'supersecret',
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET || 'access-token-secret',
    accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY || '15m',
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'refresh-token-secret',
    refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || '7d',
};
