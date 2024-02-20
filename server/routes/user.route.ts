import express, {Request, Response, NextFunction} from "express";
import { activateUser, loginUser, logoutUser, userRegistration } from "../controllers/user.controller"; 
import { isAuthenticated } from "../middleware/auth";
const userRouter = express.Router()

userRouter.post('/registration', userRegistration)
userRouter.post('/activate-user', activateUser)
userRouter.post('/login', loginUser)
userRouter.get('/logout', isAuthenticated, logoutUser)

export default userRouter;