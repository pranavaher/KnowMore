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
import CourseModel from "../models/course.model";

// Upload course
export const uploadCourse = catchAsyncError(async(req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    const thumbnail = data.thumbnail;
    
    if(thumbnail){
      const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {folder: "courses", width: 200, height: 200});

      data.thumbnail = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      }
    }

    createCourse(res, data, next);

  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500))
  }
})

// Edit course
export const editCourse = catchAsyncError(async(req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    const thumbnail = data.thumbnail;
    
    if(thumbnail){
      await cloudinary.v2.uploader.destroy(thumbnail.public_id);

      const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {folder: "courses", width: 200, height: 200});

      data.thumbnail = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      }
    }

    const courseId = req.params.id;

    const course = await CourseModel.findByIdAndUpdate(courseId, {$set: data},{new: true})
    
    res.status(201).json({
      success: true,
      course,
    })

  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500))
  }
})

// Get single course --- without purchasing
export const getSingleCourse = catchAsyncError(async(req: Request, res: Response, next: NextFunction) => {
  try {
    const courseId = req.params.id;

    const isCacheExist = await redis.get(courseId);

    if(isCacheExist){
      const course = JSON.parse(isCacheExist);
      res.status(201).json({
        success: true,
        course,
      })
    }
    else {
      const course = await CourseModel.findById(req.params.id).select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links");

      await redis.set(courseId, JSON.stringify(course));
      
      res.status(201).json({
        success: true,
        course,
      })
    }

  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500))
  }
})

// Get all courses --- without purchasing
export const getAllCourse = catchAsyncError(async(req: Request, res: Response, next: NextFunction) => {
  try {
    const isCacheExist = await redis.get("allCourses");
    
    if(isCacheExist){
      const courses = await redis.get("allCourses");

      const totalCourses = courses?.length;

      res.status(201).json({
        success: true,
        totalCourses, 
        courses,
      });
    }
    else {
      const courses = await CourseModel.find().select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links");

      await redis.set("allCourses", JSON.stringify(courses));

      const totalCourses = courses?.length;

      res.status(201).json({
        success: true,
        totalCourses, 
        courses,
      });
    }
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500))
  }
})
