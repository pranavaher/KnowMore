require("dotenv").config();
import { Request, Response, NextFunction } from "express";
import userModel, { IUser } from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import { catchAsyncError } from "../middleware/catchAsyncErrors";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";
import { accessTokenOptions, refreshTokenOptions, sendToken } from "../utils/jwt";
import { redis } from "../utils/redis";
import { getUserById } from "../services/user.service";
import cloudinary from "cloudinary";
import { createCourse } from "../services/course.service";
import courseModel from "../models/course.model";
import mongoose from "mongoose";
import { idText } from "typescript";
import notificationModel from "../models/notification.model";
import { fetchAllCourses } from "../services/course.service"
import { generateLast12MonthsData } from "../utils/analytics.generator";
import orderModel from "../models/order.model";

// Get Users analytics [ADMIN]
export const getUsersAnalytics = catchAsyncError(async(req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await generateLast12MonthsData(userModel);
    
    res.status(201).json({
      success: true,
      users,
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
}) 

// Get courses analytics [ADMIN]
export const getCoursesAnalytics = catchAsyncError(async(req: Request, res: Response, next: NextFunction) => {
  try {
    const courses = await generateLast12MonthsData(courseModel);
    
    res.status(201).json({
      success: true,
      courses,
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
}) 

// Get order analytics [ADMIN]
export const getOrderAnalytics = catchAsyncError(async(req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await generateLast12MonthsData(orderModel);
    
    res.status(201).json({
      success: true,
      order,
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
}) 