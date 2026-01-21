import { Router } from 'express';
import authController from './auth.controller';
import { validateDto } from '../../middlewares/validate.middleware';
import { RegisterDto, LoginDto, RefreshTokenDto } from './auth.dto';

const router = Router();

router.post('/register', validateDto(RegisterDto), authController.register);
router.post('/login', validateDto(LoginDto), authController.login);
// router.get('/me', protect, authController.getMe); // protect middleware needed
router.post('/refresh-token', validateDto(RefreshTokenDto), authController.refreshAccessToken);
router.post('/logout', authController.logout);

export default router;
