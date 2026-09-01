import { Router } from "express";
import { ownerOnly, protect } from "../middlewares/auth.js";
import { approveResturant, getAllResturants, getSystemStats } from "../controllers/adminController.js";


const adminRouter = Router();

adminRouter.use(protect); // Apply the protect middleware to all routes in this router
adminRouter.use(ownerOnly); // Apply the ownerOnly middleware to all routes in this router

adminRouter.get("/resturants", getAllResturants);
adminRouter.put("/resturants/:id/approve", approveResturant);
adminRouter.get("/stats", getSystemStats);

export default adminRouter;