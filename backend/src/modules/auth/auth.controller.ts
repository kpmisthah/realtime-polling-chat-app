import { Request, Response } from 'express';
import { AuthService } from './auth.service';

export class AuthController {
    constructor(private authService: AuthService) { }

    async signup(req: Request, res: Response): Promise<void> {
        try {
            const { username, email, password } = req.body;
            const result = await this.authService.register({ username, email, password });
            res.status(201).json({ message: 'User created successfully', ...result });
        } catch (error: any) {
            if (error.message === 'Username already taken' || error.message === 'Email already registered') {
                res.status(400).json({ message: error.message });
            } else {
                console.error('Signup error:', error);
                res.status(500).json({ message: 'Server error' });
            }
        }
    }

    async login(req: Request, res: Response): Promise<void> {
        try {
            const { username, password } = req.body;
            const result = await this.authService.login({ username, password });
            res.status(200).json({ message: 'Login successful', ...result });
        } catch (error: any) {
            if (error.message === 'Invalid credentials') {
                res.status(400).json({ message: error.message });
            } else {
                console.error('Login error:', error);
                res.status(500).json({ message: 'Server error' });
            }
        }
    }
}
