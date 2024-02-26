import { Response, NextFunction } from "express";
import { catchAsyncError } from "../middleware/catchAsyncErrors";
import orderModel from "../models/order.model";

// Create new order
export const newOrder = catchAsyncError(async(data: any, next: NextFunction, res: Response) => {
  const order = await orderModel.create(data);

  res.status(201).json({
    success: true,
    order,
  })
})

// Get All Orders
export const fetchAllOrders = async (res:Response) => {
  const orders = await orderModel.find().sort({createdAt: -1});

  res.status(201).json({
    success: true,
    orders
  }); 
}