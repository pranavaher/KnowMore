import express, {Request, Response, NextFunction} from "express";
import { activateUser, loginUser, logoutUser, userRegistration } from "../controllers/user.controller"; 
const userRouter = express.Router()

userRouter.post('/registration', userRegistration)
userRouter.post('/activate-user', activateUser)
userRouter.post('/login', loginUser)
userRouter.get('/logout', logoutUser)

export default userRouter;