import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { IAuthRepository } from './auth.repository';
import { IUser } from './user.model';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'access_fallback';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh_fallback';

export class AuthService {
    constructor(private authRepository: IAuthRepository) { }

    async register(userData: Partial<IUser>) {
        const existingUser = await this.authRepository.findUserByUsername(userData.username!);
        if (existingUser) {
            throw new Error('Username already taken');
        }

        const existingEmail = await this.authRepository.findUserByEmail(userData.email!);
        if (existingEmail) {
            throw new Error('Email already registered');
        }

        const newUser = await this.authRepository.createUser(userData);
        const accessToken = this.generateAccessToken(newUser);
        const refreshToken = this.generateRefreshToken(newUser);

        return {
            user: { id: newUser._id, username: newUser.username, email: newUser.email },
            accessToken,
            refreshToken
        };
    }

    async login(userData: Partial<IUser>) {
        // Try to find user by Username first, then Email if not found (or treat username field as strictly one or other if implied, but here we check both)
        // Actually, cleaner approach implies one field 'username' from client covers both, OR separate fields.
        // Let's assume the 'username' field in user object might hold an email.
        const identifier = userData.username!;

        let user = await this.authRepository.findUserByUsername(identifier);

        if (!user) {
            user = await this.authRepository.findUserByEmail(identifier);
        }

        if (!user || user.password === undefined) {
            throw new Error('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(userData.password!, user.password);
        if (!isMatch) {
            throw new Error('Invalid credentials');
        }

        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);

        return {
            user: { id: user._id, username: user.username },
            accessToken,
            refreshToken
        };
    }

    private generateAccessToken(user: IUser): string {
        return jwt.sign(
            { id: user._id, username: user.username },
            ACCESS_TOKEN_SECRET,
            { expiresIn: '15m' }
        );
    }

    private generateRefreshToken(user: IUser): string {
        return jwt.sign(
            { id: user._id, username: user.username },
            REFRESH_TOKEN_SECRET,
            { expiresIn: '7d' }
        );
    }
}
