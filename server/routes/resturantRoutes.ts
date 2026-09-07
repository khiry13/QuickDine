import { Router } from "express";
import { getFeaturedResturants, getResturantAvailability, getResturantBySlug, getResturants } from "../controllers/resturantController.js";


const resturantRouter = Router();

resturantRouter.get("/", getResturants);
resturantRouter.get("/featured", getFeaturedResturants);
resturantRouter.get("/:slug", getResturantBySlug);
resturantRouter.get("/:id/availability", getResturantAvailability);


export default resturantRouter;