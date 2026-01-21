import { Request, Response, NextFunction } from 'express';
import authService from './auth.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/ApiResponse';

class AuthController {
    register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const { user, accessToken, refreshToken } = await authService.register(req.body);

        // Hide password in response
        user.password = undefined;

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(201).json(new ApiResponse(201, { user, accessToken }, 'User registered successfully'));
    });

    login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const { user, accessToken, refreshToken } = await authService.login(req.body);

        // Hide password in response
        user.password = undefined;

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json(new ApiResponse(200, { user, accessToken }, 'User logged in successfully'));
    });

    refreshAccessToken = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

        if (!incomingRefreshToken) {
            throw new Error('Unauthorized request'); // Simplify for now vs ApiError
        }

        const { accessToken, refreshToken } = await authService.refreshAccessToken(incomingRefreshToken);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json(new ApiResponse(200, { accessToken }, 'Access token refreshed'));
    });

    logout = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        // Need user ID from verified token middleware
        // For logout, knowing strictly who is calling might require middleware.
        // If we just want to clear cookie:

        // However, we implemented `authService.logout(userId)` which clears it from DB.
        // Assuming we will have a middleware `verifyJWT` that populates `req.user`.

        // If not, we can rely on the cookie if verify middleware isn't present, 
        // but 'logout' usually implies authenticated. 
        // I'll check if req.user is available, otherwise just clear cookie.

        // For now, let's just clear cookie and if they are logged in (req.user exists), clear from DB.
        // We'll update this once middleware is in place.

        if ((req as any).user) {
            await authService.logout((req as any).user._id);
        }

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'
        });

        res.status(200).json(new ApiResponse(200, {}, 'User logged out successfully'));
    });

    getMe = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        // Current user is attached to req.user by auth middleware (to be implemented)
        // For now, assuming middleware logic will exist
        // const user = await authService.getUserById(req.user.id);

        // Placeholder response until middleware is connected
        res.status(200).json(new ApiResponse(200, {}, 'User profile'));
    });
}

export default new AuthController();
