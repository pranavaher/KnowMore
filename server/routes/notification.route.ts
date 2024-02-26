import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import { getNotification } from "../controllers/notifivation.controller";

const notificationRouter = express.Router();

notificationRouter.get("/get-all-notifications", isAuthenticated, authorizeRoles("admin"), getNotification);

export default notificationRouter;