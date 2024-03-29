import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";

import { addAnwser, addQuestion, addReplyToReview, addReview, deleteCourse, editCourse, getAllCourse, getAllCourses, getCourseByUser, getSingleCourse, uploadCourse } from "../controllers/course.controller";

const courseRouter = express.Router();

courseRouter.post("/create-course", isAuthenticated, authorizeRoles("admin"), uploadCourse);
courseRouter.put("/edit-course/:id", isAuthenticated, authorizeRoles("admin"), editCourse);
courseRouter.get("/get-course/:id", getSingleCourse);
courseRouter.get("/get-all-courses", getAllCourse);
courseRouter.get("/get-course-content/:id", isAuthenticated, getCourseByUser);
courseRouter.put("/add-question", isAuthenticated, addQuestion);
courseRouter.put("/add-answer", isAuthenticated, addAnwser);
courseRouter.put("/add-review/:id", isAuthenticated, addReview);
courseRouter.put("/add-reply", isAuthenticated, authorizeRoles("admin"), addReplyToReview);
courseRouter.delete("/delete-course/:id", isAuthenticated, authorizeRoles("admin"), deleteCourse);

courseRouter.get("/fetch-all-courses", isAuthenticated, authorizeRoles("admin"), getAllCourses);

export default courseRouter;