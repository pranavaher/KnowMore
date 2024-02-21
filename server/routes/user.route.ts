import express, {Request, Response, NextFunction} from "express";
import { activateUser, getUserInfo, loginUser, logoutUser, socialAuth, updateAccessToken, updateUserInfo, userRegistration } from "../controllers/user.controller"; 
import { isAuthenticated } from "../middleware/auth";
const userRouter = express.Router()

userRouter.post('/registration', userRegistration)
userRouter.post('/activate-user', activateUser)
userRouter.post('/login', loginUser)
userRouter.get('/logout', isAuthenticated, logoutUser)
userRouter.get('/refreshtoken', updateAccessToken)
userRouter.get('/me', isAuthenticated, getUserInfo)
userRouter.post('/social-auth', socialAuth)
userRouter.put('/update-user-info', isAuthenticated, updateUserInfo)

export default userRouter;