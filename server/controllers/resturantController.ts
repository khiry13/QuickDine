import { Request, Response } from "express";
import Resturant from "../models/Resturant.js";
import jwt from "jsonwebtoken"
import User from "../models/User.js";
import Booking from "../models/Booking.js";


// Get /api/resturants
export const getResturants = async (req: Request, res: Response) => {
    try {
        const {search, priceRange, rating, location, sort} = req.query;

        // Build query object
        const queryObj:any = {status: "approved"};

        if(search) {
            queryObj.$or = [
                { name: { $regex: search, $options: "i" } },
                { tags: { $regex: search, $options: "i" } },
                {location: { $regex: search, $options: "i" } },
            ]
        }

        if(priceRange) {
            const prices = Array.isArray(priceRange) ? priceRange : [priceRange];
            queryObj.priceRange = { $in: prices };
        }

        if(rating) {
            queryObj.rating = { $gte: parseFloat(rating as string) };
        }

        if(location) {
            queryObj.location = { $regex: location as string, $options: "i" };
        }

        // Sorting
        let sortOption: any = {createdAt: -1}
        if(sort === "rating") {
            sortOption = {rating: -1}
        } else if (sort === "price_low") {
            sortOption = {priceRange: 1}
        } else if (sort === "price_high") {
            sortOption = {priceRange: -1}
        }

        const resturant = await Resturant.find(queryObj).sort(sortOption);
        res.json(resturant);

    } catch (error: any) {
        console.error("Error fetching resturants:", error);
        res.status(400).json({ message: "Error fetching resturants", error: error.message });
    }
}


// Get /api/resturants/featured
export const getFeaturedResturants = async (req: Request, res: Response) => {
    try {
        const featured = await Resturant.find({
            status: "approved",
            $or: [{featured: true}, {exclusive: true}]
        }).limit(6)
        res.json(featured);
    } catch (error: any) {
        console.error("Error fetching resturants:", error);
        res.status(400).json({ message: "Error fetching resturants", error: error.message });
    }
}


// Get /api/resturants/:slug
export const getResturantBySlug = async (req: Request, res: Response) => {
    try {
        const resturant = await Resturant.findOne({slug: req.params.slug});

        if(!resturant) {
            res.status(404).json({ message: "Resturant not found" });
            return;
        }

        // if not approved, verify authorization (owner or admin)
        if(resturant.status !== "approved") {
            let isAuthorized = false;
            if(req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
                try {
                    const token = req.headers.authorization.split(" ")[1];
                    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {id: string};

                    const user = await User.findById(decoded.id);

                    if(user && (user.role === "admin" || (user.role === "owner" && resturant.owner.toString() === user._id.toString()))) {
                        isAuthorized = true;
                    }
                } catch (error) {
                    // Ignore token verify error
                }
            }

            if(!isAuthorized) {
                res.status(404).json({ message: "Resturant not found or pending approval" });
                return;
            }
        }

        res.json(resturant);
    } catch (error: any) {
        console.error("Error fetching resturants:", error);
        res.status(400).json({ message: "Error fetching resturants", error: error.message });
    }
}

// Get /api/resturants/:id/availability
export const getResturantAvailability = async (req: Request, res: Response) => {
    try {
        const {date} = req.query
        if(!date) {
            res.status(400).json({ message: "Date query parameter is required" });
            return
        }

        const resturant = await Resturant.findById(req.params.id);
        if(!resturant) {
            res.status(404).json({ message: "Resturant not found" });
            return;
        }

        const bookingDate = new Date(date as string)

        // Get all active booking on this date for the resturant
        const bookings = await Booking.find({
            resturant: resturant._id,
            date: bookingDate,
            status: "confirmed",
        })

        // Map slots to available capacities
        const availability = resturant.availableSlots.map(slot => {
            const bookedSeats = bookings.filter(booking => booking.time === slot).reduce((sum, b) => sum + b.guests, 0);
            const totalSeats = resturant.totalSeats || 20;
            const availableSeats = Math.max(0, totalSeats - bookedSeats);
            return {
                time: slot,
                availableSeats,
                isAvailable: availableSeats > 0  
            }
        })

        res.json(availability)

    } catch (error: any) {
        console.error("Error fetching resturants:", error);
        res.status(400).json({ message: "Error fetching resturants", error: error.message });
    }
}