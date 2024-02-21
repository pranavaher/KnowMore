import express, {Request, Response, NextFunction} from "express";
import { activateUser, getUserInfo, loginUser, logoutUser, socialAuth, updateAccessToken, updatePassword, updateUserInfo, updateProfilePicture, userRegistration } from "../controllers/user.controller"; 
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
userRouter.put('/update-user-password', isAuthenticated, updatePassword)
userRouter.put('/update-user-avatar', isAuthenticated, updateProfilePicture)

export default userRouter;