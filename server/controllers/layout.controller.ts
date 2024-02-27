require("dotenv").config();
import { Request, Response, NextFunction } from "express";
import userModel, { IUser } from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import { catchAsyncError } from "../middleware/catchAsyncErrors";
import layoutModel from "../models/layout.model";
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

// Create Layout
export const createLayout = catchAsyncError(async(req: Request, res: Response, next: NextFunction) => {
  try {
    const {type} = req.body;

    if(type === "Baner"){
      const {image, title, subTitle } = req.body;
      const myCloud = await cloudinary.v2.uploader.upload(image, {folder: "layout"});

      const banner = {
        image: {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        },
        title,
        subTitle,
      }

      await layoutModel.create(banner);
    }
    else if(type === "FAQ") {
      const {faq} = req.body;
      const faqItems = await Promise.all(
        faq.map(async(item: any) => {
          return {
            question: item.question,
            answer: item.answer,
          };
        })
      );

      await layoutModel.create({type: "FAQ", faq: faqItems});
    }
    else if (type === "Categories") {
      const {categories} = req.body;
      const categoriesItems = await Promise.all(
        categories.map(async(item: any) => {
          return {
            title: item.title
          };
        })
      );
      await layoutModel.create({type: "Categories", categories: categoriesItems});
    }

    res.status(200).json({
      success: true,
      message: "Layout created successfully."
    })

  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500))
  }
})

// Edit Layout
export const editLayout = catchAsyncError(async(req: Request, res: Response, next: NextFunction) => {
  try {
    const {type} = req.body;

    if(type === "Baner"){
      const bannerData: any = await layoutModel.findOne({ type: "Banner" });
      const {image, title, subTitle } = req.body;

      if(bannerData){
        await cloudinary.v2.uploader.destroy(bannerData.image.public_id);
      }

      const myCloud = await cloudinary.v2.uploader.upload(image, {folder: "layout"});

      const banner = {
        image: {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        },
        title,
        subTitle,
      }

      await layoutModel.findByIdAndUpdate(bannerData?._id, {banner});
    }
    else if(type === "FAQ") {
      const {faq} = req.body;
      const faqItem = await layoutModel.findOne({ type: "FAQ"} );
      const faqItems = await Promise.all(
        faq.map(async(item: any) => {
          return {
            question: item.question,
            answer: item.answer,
          };
        })
      );

      await layoutModel.findByIdAndUpdate(faqItem?._id, {type: "FAQ", faq: faqItems});
    }
    else if (type === "Categories") {
      const {categories} = req.body;
      const categoryItem = await layoutModel.findOne({ type: "Categories"} );

      const categoriesItems = await Promise.all(
        categories.map(async(item: any) => {
          return {
            title: item.title
          };
        })
      );
      await layoutModel.findByIdAndUpdate(categoryItem?._id, {type: "Categories", categories: categoriesItems});
    }

    res.status(200).json({
      success: true,
      message: "Layout updated successfully."
    })

  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
})

// Get Layout by Type
export const getLayoutByType = catchAsyncError(async(req: Request, res: Response, next: NextFunction) => {
  try {
    const {type} = req.body;
    const layout = await layoutModel.findOne({type});
    
    res.status(201).json({
      success: true,
      layout
    })
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500))
  }
})