import { Router } from "express";
import { ownerOnly, protect } from "../middlewares/auth.js";
import { createOwnerResturant, getOwnerBookings, getOwnerResturant, updateBookingStatus, updateOwnerResturant } from "../controllers/ownerController.js";
import upload from "../config/multer.js";


const ownerRouter = Router();

ownerRouter.use(protect); // Apply the protect middleware to all routes in this router
ownerRouter.use(ownerOnly); // Apply the ownerOnly middleware to all routes in this router

ownerRouter.get("/resturant", getOwnerResturant);
ownerRouter.post("/resturant", upload.single("image"), createOwnerResturant);
ownerRouter.put("/resturant", upload.single("image"), updateOwnerResturant);
ownerRouter.get("/bookings", getOwnerBookings);
ownerRouter.put("/bookings/:id/status", updateBookingStatus);

export default ownerRouter;