import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { catchAsyncError } from "../middleware/catchAsyncErrors";

import notificationModel from "../models/notification.model"

import cron from "node-cron"

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

// Delete notification 
cron.schedule("0 0 0 * * *", async() => {
  try {
    const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000 );
    await notificationModel.deleteMany({status: "read", createdAt: {$lt: THIRTY_DAYS_AGO}})
  } catch (error: any) {
    return new ErrorHandler(error.message, 500);
  }
})

