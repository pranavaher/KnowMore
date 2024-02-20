import express, {Request, Response, NextFunction} from "express";
import { activateUser, userRegistration } from "../controllers/user.controller"; 
const userRouter = express.Router()

userRouter.post('/registration', userRegistration)
userRouter.post('/activate-user', activateUser)

export default userRouter;