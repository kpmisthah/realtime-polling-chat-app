import jwt, { JwtPayload } from 'jsonwebtoken';
import authRepository from './auth.repository';
import { IUser } from './auth.model';
import { ApiError } from '../../utils/ApiError';
import { env } from '../../config/env';
import { RegisterDto, LoginDto } from './auth.dto';

class AuthService {
    async register(userData: RegisterDto): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
        const { email } = userData;

        const existingUser = await authRepository.findUserByEmail(email);
        if (existingUser) {
            throw new ApiError(400, 'User already exists');
        }

        const user = await authRepository.createUser(userData);

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save();

        return { user, accessToken, refreshToken };
    }

    async login(userData: LoginDto): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
        const { email, password } = userData;

        if (!email || !password) {
            throw new ApiError(400, 'Please provide an email and password');
        }

        const user = await authRepository.findUserByEmail(email);
        if (!user) {
            throw new ApiError(401, 'Invalid credentials');
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            throw new ApiError(401, 'Invalid credentials');
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save();

        return { user, accessToken, refreshToken };
    }

    async refreshAccessToken(incomingRefreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
        try {
            const decoded = jwt.verify(incomingRefreshToken, env.refreshTokenSecret) as JwtPayload;

            const user = await authRepository.findUserById(decoded._id);

            if (!user) {
                throw new ApiError(401, 'Invalid refresh token');
            }

            if (incomingRefreshToken !== user.refreshToken) {
                throw new ApiError(401, 'Refresh token is expired or used');
            }

            const accessToken = user.generateAccessToken();
            const newRefreshToken = user.generateRefreshToken();

            user.refreshToken = newRefreshToken;
            await user.save();

            return { accessToken, refreshToken: newRefreshToken };

        } catch (error) {
            throw new ApiError(401, 'Invalid refresh token');
        }
    }

    async logout(userId: string): Promise<void> {
        await authRepository.updateUser(userId, { refreshToken: undefined });
    }
}

export default new AuthService();
