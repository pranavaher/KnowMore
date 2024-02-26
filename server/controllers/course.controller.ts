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

    const course = await courseModel.findByIdAndUpdate(courseId, {$set: data},{new: true})
    
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
      const course = await courseModel.findById(req.params.id).select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links");

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
      const courses = await courseModel.find().select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links");

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

// Define an interface to extend the Request type
interface AuthenticatedRequest extends Request {
  user?: any; // Define the user property
}

// Get course content --- only valid user
export const getCourseByUser = catchAsyncError(async(req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userCourseList = req.user?.courses;
    const courseId = req.params.id;

    const courseExists = userCourseList?.find((course: any) => course._id.toString() === courseId);

    if(!courseExists){
      return next(new ErrorHandler("You are not eligible to access this course.", 404));
    }

    const course = await courseModel.findById(courseId);

    const content = course?.courseData;

    res.status(201).json({
      success: true,
      content,
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500))
  }
})

// Get All Courses
export const getAllCourses = catchAsyncError(async(req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    fetchAllCourses(res);
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 400));
  }
})

// Add questions in course
interface IAddQuestionData {
  question: string;
  courseId: string;
  contentId: string;
}

export const addQuestion =  catchAsyncError(async(req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const {question, courseId, contentId}: IAddQuestionData = req.body;
    const course = await courseModel.findById(courseId);

    if(!mongoose.Types.ObjectId.isValid(contentId)){
      return next(new ErrorHandler("Invalid content id.", 400))
    }
    
    const courseContent = course?.courseData?.find((item: any) => item._id.toString() === contentId);
    
    if(!courseContent) {
      return next(new ErrorHandler("Invalid content id.", 500));
    }

    // create new question
    const newQuestion: any = { user: req.user, question, questionReplies: [] };

    // add question to course content
    courseContent.questions.push(newQuestion);

    await notificationModel.create({
      user: req.user?._id,
      title: "New Question",
      message: `New question is asked in ${courseContent?.title} of course ${course?.name}`
    });

    await course?.save();

    res.status(200).json({
      success: true,
      course
    });    
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
})

// Add answer to course question
interface IAddAnswerData {
  answer: string;
  courseId: string;
  contentId: string;
  questionId: string;
}

export const addAnwser = catchAsyncError(async(req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const {answer, courseId, contentId, questionId}: IAddAnswerData = req.body;
    
    const course = await courseModel.findById(courseId);

    if(!mongoose.Types.ObjectId.isValid(contentId)){
      return next(new ErrorHandler("Invalid content id.", 400))
    }
    
    const courseContent = course?.courseData?.find((item: any) => item._id.toString() === contentId);
    
    if(!courseContent) {
      return next(new ErrorHandler("Invalid content id.", 400));
    }

    const question = courseContent?.questions?.find((item: any) => item._id.toString() === questionId);

    if(!question){
    return next(new ErrorHandler("Invalid question id.", 400));
    }

    // create new answer object
    const newAnswer: any = { user: req.user, answer };

    question?.questionReplies?.push(newAnswer);

    await course?.save();

    if(req.user?._id === question.user._id){
      await notificationModel.create({
        user: req.user?._id,
        title: "New Answer to Question",
        message: `New answer is added in ${courseContent?.title} of course ${course?.name}`
      });
    }
    else {
      const data = { name: question.user.name, title: courseContent.title };

      const html = await ejs.renderFile(path.join(__dirname, "../mails/question-reply.ejs"), data);

      try {
        await sendMail({
          email: question.user.email, 
          subject: "Question Reply", 
          template: "question-reply.ejs", 
          data
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }
    }

    res.status(200).json({
      success: true,
      course,
    })

  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// Add review
interface IAddReviewData {
  review: string;
  courseId: string;
  rating: number;
  userId: string;
}

export const addReview = catchAsyncError(async(req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userCourseList = req.user?.courses;
    const courseId = req.params.id;

    const courseExists = userCourseList.find((course: any) => course._id.toString() === courseId.toString() );


    if(!courseExists){
      return next(new ErrorHandler("Please purchase this code to add your review.", 404));
    }

    const course = await courseModel.findById(courseId);
    
    const {review, rating} = req.body as IAddReviewData;

    const reviewData: any = {
      user: req.user,
      rating,
      comment: review,
    }

    course?.reviews.push(reviewData);

    let avg = 0;

    course?.reviews.forEach((rev: any) => {
      avg += rev.rating;
    })

    if(course){
      course.ratings = avg / course.reviews.length;
    }

    await course?.save();

    const notification = {
      title: "New review",
      message: `${req.user.name} has given a review on your course ${course?.name} .`,
    }

    // create notification

    res.status(200).json({
      success: true,
      course,
    });

  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
})

// Add reply to review
interface IReplyToReviewData {
  comment: string;
  courseId: string;
  reviewId: string;
}

export const addReplyToReview = catchAsyncError(async(req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const {comment, courseId, reviewId} = req.body as IReplyToReviewData;

    const course = await courseModel.findById(courseId);

    if(!course){
      return next(new ErrorHandler("Course not found", 404));
    }
    
    const review = course?.reviews?.find((review: any) => review._id.toString() === reviewId);
    
    if(!review){
      return next(new ErrorHandler("Review not found", 404));
    }

    const replyData: any = {
      user: req.user,
      comment,
    }

    if(review.commentReplies){
      review.commentReplies = [];
    }
    
    review.commentReplies?.push(replyData);

    await course?.save();

    res.status(200).json({
      success: true,
      course,
    })

  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
})


// Delete Course
export const deleteCourse = catchAsyncError(async(req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const {id} = req.params;
    
    const course = await courseModel.findById(id);

    if(!course) {
      return next(new ErrorHandler("Course not found.", 400));
    }
    
    await course.deleteOne({id});

    await redis.del(id);

    res.status(200).json({
      success: true,
      message: "Course deleted successfully"
    });

  } catch (error: any) {
    return next(new ErrorHandler(error.message, 400));
  }
})