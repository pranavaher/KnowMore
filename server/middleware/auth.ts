import { Request, Response, NextFunction } from "express";
import { catchAsyncError } from "./catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import jwt, { JwtPayload } from "jsonwebtoken"
import { redis } from "../utils/redis";

// Define an interface to extend the Request type
interface AuthenticatedRequest extends Request {
    user?: any; // Define the user property
}

// authenticated user
export const isAuthenticated = catchAsyncError(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const access_token = req.cookies.access_token;

    if (!access_token) {
        return next(new ErrorHandler("Please login to access this resource.", 400))
    }

    const decoded = await jwt.verify(access_token, process.env.ACCESS_TOKEN as string) as JwtPayload;

    if (!decoded) {
        return next(new ErrorHandler("Access token is invalid", 400));
    }

    const user = await redis.get(decoded.id);

    if (!user) {
        return next(new ErrorHandler("User not found", 400));
    }

    req.user = JSON.parse(user);
    next();
})

export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if(!roles.includes(req.user?.role || "")){
      return next(new ErrorHandler(`Role ${req.user?.role} is not allowed to access this resource`, 403));
    }
    next();
  }
}
