require("dotenv").config();
import express, {Request, Response, NextFunction} from "express";
export const app = express();
import cors from "cors";
import cookieParser from "cookie-parser";
import {ErrorMiddleware} from "./middleware/error";
import userRouter from "./routes/user.route";
import courseRouter from "./routes/course.route";
import orderRouter from "./routes/order.route";
import notificationRouter from "./routes/notification.route";
import analyticsRouter from "./routes/analytics.route";

// body parser
app.use(express.json({ limit: "50mb" }))

// cookie parser
app.use(cookieParser())

// cors
app.use(
  cors({
    origin: process.env.ORIGIN,
  })
)

app.use("/api/v1/", userRouter)
app.use("/api/v1/", courseRouter)
app.use("/api/v1/", orderRouter)
app.use("/api/v1/", notificationRouter)
app.use("/api/v1/", analyticsRouter)

// testing API
app.get("/test",(req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    success: true,
    message: "API is working"
  });
})

app.get("*", (req: Request, res: Response, next: NextFunction) => {
  const err: any = new Error(`Route ${req.originalUrl} not found.`);
  err.statusCode = 404;
  next(err);
});

app.use(ErrorMiddleware)