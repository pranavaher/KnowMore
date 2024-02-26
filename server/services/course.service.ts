import { Response, NextFunction } from "express";
import courseModel from "../models/course.model";
import { redis } from "../utils/redis";

// Create course
export const createCourse = async(res: Response, data: any, next: NextFunction) => {
    const course = await courseModel.create(data);
    
    res.status(201).json({
      success: true,
      course,
    })
}

// Get All Courses
export const fetchAllCourses = async (res:Response) => {
  const courses = await courseModel.find().sort({createdAt: -1});
  
  res.status(201).json({
    success: true,
    courses
  }); 
}