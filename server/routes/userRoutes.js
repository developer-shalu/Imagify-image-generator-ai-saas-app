import express from 'express';
import { registerUser, loginUser, userCredits, paymentRazorpay, verifyRazorpay } from '../controllers/userController.js';
import userAuth from '../middlewares/auth.js';

const userRouter = express.Router();

// Route for user registration
userRouter.post('/register', registerUser);
userRouter.post('/login', loginUser);
userRouter.get('/credits', userAuth, userCredits);
userRouter.post('/pay-razor', userAuth, paymentRazorpay);
userRouter.post('/verify-razor', userAuth, verifyRazorpay);

export default userRouter;

//http://localhost:5000/api/users/register
//http://localhost:5000/api/users/login
