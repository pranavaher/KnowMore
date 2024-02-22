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

