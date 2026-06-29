import express from 'express';
import { auth } from '../middleware/auth.js';
import * as authController from '../controllers/authController.js';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/register/send-otp', authController.sendRegisterOTP);
router.post('/register/verify', authController.verifyRegisterOTP);
router.post('/login/send-otp', authController.sendLoginOTP);
router.post('/login/verify', authController.verifyLoginOTP);
router.post('/google-login', authController.googleLogin);
router.put('/profile', auth, authController.updateProfile);
router.get('/me', auth, authController.getMe);

export default router;
