import { Request, Response, NextFunction } from "express";
import { catchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";

import {IOrder} from "../models/order.model";
import userModel from "../models/user.model";
import notificationModel from "../models/notification.model";

import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";
import courseModel from "../models/course.model";
import { newOrder, fetchAllOrders } from "../services/order.service";

interface AuthenticatedRequest extends Request {
  user?: any; // Define the user property
}

// Create order
export const createOrder = catchAsyncError(async(req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const {courseId, payment_info} = req.body as IOrder;

    const user = await userModel.findById(req.user._id);
    
    const courseExists = user?.courses?.some((course: any) => course._id.toString() === courseId);

    if(courseExists){
      return next(new ErrorHandler("You have already purchased this course.", 400));
    }

    const course = await courseModel.findById(courseId);

    if(!course){
      return next(new ErrorHandler("Course not found.", 400));
    }

    const data: any = {
      courseId: course._id,
      userId: user?._id,
      payment_info,
    }

    newOrder(data, res, next);

    const mailData: any = {
      order: {
        _id: course._id,
        name: course.name,
        price: course.price,
        date: new Date().toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'}),
      }
    }

    const html = await ejs.renderFile(path.join(__dirname, "../mails/order-confirmation.ejs"), {order: mailData});

    try {
      if(user){
        await sendMail({
          email: user.email,
          subject: "Order Confirmation",
          template: "order-confirmation.ejs",
          data: mailData
        });
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }

    user?.courses.push(course?._id);

    await user?.save();

    await notificationModel.create({
      user: user?._id,
      title: "New order",
      message: `You have new order for course ${course?.name}`
    });

    course.purchased ? course.purchased += 1 : course.purchased;

    await course.save();

  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
})

// Get All Orders
export const getAllOrders = catchAsyncError(async(req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    fetchAllOrders(res);
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 400));
  }
})