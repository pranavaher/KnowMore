require("dotenv").config();
import notificationModel from "../models/notification.model"
import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { catchAsyncError } from "../middleware/catchAsyncErrors";

interface AuthenticatedRequest extends Request {
  user?: any; // Define the user property
}

// Get All Notificationa [ADMIN]
export const getNotification = catchAsyncError(async(req: Request, res: Response, next: NextFunction) => {
  try {
    const notifications = await notificationModel.find().sort({createdAt: -1});

    res.status(201).json({
      success: true,
      notifications,
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
})

// Update Notification status [ADMIN]
export const updateNotification = catchAsyncError(async(req: Request, res: Response, next: NextFunction) => {
  try {
    const notification = await notificationModel.findById(req.params.id);
    
    if(!notification){
      return next(new ErrorHandler("Notification not found", 404));
    }
    else {
      notification.status ? notification.status = "read" : notification.status; 
    }

    await notification.save();

    const notifications = await notificationModel.find().sort({createdAt: -1});

    res.status(201).json({
      success: true,
      notifications,
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
})

