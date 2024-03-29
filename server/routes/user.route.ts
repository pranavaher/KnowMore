import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";

import { activateUser, getUserInfo, loginUser, logoutUser, socialAuth, updateAccessToken, updatePassword, updateUserInfo, updateProfilePicture, userRegistration, getAllUsers, updateUserRole, deleteUser } from "../controllers/user.controller"; 

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
userRouter.put('/update-user-role', isAuthenticated, authorizeRoles("admin"), updateUserRole)
userRouter.delete('/delete-user/:id', isAuthenticated, authorizeRoles("admin"), deleteUser)

userRouter.get("/get-all-users", isAuthenticated, authorizeRoles("admin"), getAllUsers)

export default userRouter;