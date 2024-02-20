import ErrorHandler from "../utils/ErrorHandler";
import {Request, Response, NextFunction} from "express";

export const ErrorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal server error.";

  // wrong mongodb ID
  if(err.name === "CastError"){
    const message = `Restore not found. Invalid: ${err.path}`;
    err = new ErrorHandler(message, 400);
  }

  // Duplicate key error
  if(err.code === 11000){
    const message = `Duplicate ${Object.keys(err.keyValue)} entered.`;
    err = new ErrorHandler(message, 400);
  }

  // wrong JWT error
  if(err.name === "JsonWebTokenError"){
    const message = `Invalid Json web token, try again`;
    err = new ErrorHandler(message, 400);
  }

  // JWT expired error
  if(err.name === "TokenExpiredError"){
    const message = `Json web token is expired, try again.`;
    err = new ErrorHandler(message, 400);
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message
  })

}