import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.js";
import Resturant from "../models/Resturant.js";
import User from "../models/User.js";
import Booking from "../models/Booking.js";


// Get all resturants for admin management
// GET /api/admin/resturants
export const getAllResturants = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const resturants = await Resturant.find({}).populate("owner", "name email phone").sort({ createdAt: -1 });
    res.json(resturants);
  } catch (error: any) {
    console.error("Error getting all resturants: ", error);
    res.status(400).json({ error: error.message || "Internal Server Error" });
  }
};

// Approve/Reject a resturant profile
// PUT /api/admin/resturant/:id/approve
export const approveResturant = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const {status} = req.body;
    if(!status || !["approved", "rejected", "pending"].includes(status)) {
      res.status(400).json({ message: "Invalid status value" });
      return;
    }

    const resturant = await Resturant.findById(req.params.id);
    if(!resturant) {
      res.status(404).json({ message: "Resturant not found" });
      return;
    }

    resturant.status = status as "approved" | "rejected" | "pending";
    const updatedResturant = await resturant.save();
    res.json(updatedResturant);
  } catch (error: any) {
    console.error("Error updating resturant status: ", error);
    res.status(400).json({ error: error.message || "Internal Server Error" });
  }
};


// Get system statistics for admin dashboard
// GET /api/admin/stats
export const getSystemStats = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const totalUsers = await User.countDocuments({role: "user"});
    const totalOwners = await User.countDocuments({role: "owner"});
    const totalBookings = await Booking.countDocuments({});
    const totalResturants = await Resturant.countDocuments({});

    // Get latest 10 bookings with user and resturant details
    const latestBookings = await Booking.find({})
      .populate("user", "name email")
      .populate("resturant", "name")
      .sort({ createdAt: -1 })
      .limit(10);


    res.json({
      users: {
        totalUsers,
        totalOwners,
        total : totalUsers + totalOwners
      },
      resturants: {
        total: totalResturants
      },
      bookings: {
        total: totalBookings,
      },
      latestBookings,
    });
  } catch (error: any) {
    console.error("Error getting system stats: ", error);
    res.status(400).json({ error: error.message || "Internal Server Error" });
  }
};