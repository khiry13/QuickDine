import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.js";
import Resturant from "../models/Resturant.js";
import { v2 as cloudinary } from "cloudinary";
import Booking from "../models/Booking.js";

// Helper function to upload buffer to Cloudinary
const uploadToCloudinary = async (
  fileBuffer: Buffer,
): Promise<{ secure_url: string }> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "QuickDine" },
      (error: any, result: any) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("No result from Cloudinary"));
        resolve({ secure_url: result.secure_url });
      },
    );
    stream.end(fileBuffer);
  });
};

// Get owner's resturant
// GET /api/owner/resturant
export const getOwnerResturant = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const resturant = await Resturant.findOne({ owner: req.user?._id });
    if (!resturant) {
      res.status(404).json({ message: "Resturant not found" });
      return;
    }
    res.json(resturant);
  } catch (error: any) {
    console.error("Error getting owner's resturant: ", error);
    res.status(400).json({ error: error.message || "Internal Server Error" });
  }
};

// Create owner's resturant
// POST /api/owner/resturant
export const createOwnerResturant = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const existingResturant = await Resturant.findOne({ owner: req.user?._id });
    if (existingResturant) {
      res.status(400).json({ message: "Owner already has a resturant" });
      return;
    }

    const {
      name,
      description,
      cuisine,
      priceRange,
      location,
      address,
      chef,
      tags,
      availableSlots,
      totalSeats,
    } = req.body;

    if (
      !name ||
      !description ||
      !cuisine ||
      !priceRange ||
      !location ||
      !address ||
      !chef
    ) {
      res.status(400).json({ message: "Please provide all required fields" });
      return;
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const slugExists = await Resturant.findOne({ slug });
    if (slugExists) {
      res
        .status(400)
        .json({ message: "Resturant with this name already exists" });
      return;
    }

    // Handle image upload if provided
    let imageUrl = "";
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      imageUrl = result.secure_url;
    }

    // Setup parsed tags and slots
    const parsedTags =
      typeof tags === "string"
        ? tags.split(",").map((tag: string) => tag.trim())
        : tags || [];
    const parsedSlots =
      typeof availableSlots === "string"
        ? availableSlots.split(",").map((slot: string) => slot.trim())
        : availableSlots || ["17:00", "18:00", "19:00", "20:00", "21:00"];

    const newResturant = await Resturant.create({
      name,
      slug,
      description,
      cuisine,
      priceRange,
      location,
      address,
      chef,
      image: imageUrl,
      tags: parsedTags,
      availableSlots: parsedSlots,
      totalSeats: totalSeats ? Number(totalSeats) : 20, // Default to 50 if not provided
      owner: req.user?._id,
      status: "pending", // New resturants are pending approval
    });

    res.status(201).json(newResturant);
  } catch (error: any) {
    console.error("Error creating owner's resturant: ", error);
    res.status(400).json({ error: error.message || "Internal Server Error" });
  }
};

// Update owner's resturant
// PUT /api/owner/resturant
export const updateOwnerResturant = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const resturant = await Resturant.findOne({ owner: req.user?._id });
    if (!resturant) {
      res.status(404).json({ message: "Resturant not found" });
      return;
    }

    const {
      name,
      description,
      cuisine,
      priceRange,
      location,
      address,
      chef,
      tags,
      availableSlots,
      totalSeats,
    } = req.body;

    // Update fields if provided
    if (name) resturant.name = name;
    if (description) resturant.description = description;
    if (cuisine) resturant.cuisine = cuisine;
    if (priceRange) resturant.priceRange = priceRange;
    if (location) resturant.location = location;
    if (address) resturant.address = address;
    if (chef) resturant.chef = chef;
    if (tags) {
      resturant.tags =
        typeof tags === "string"
          ? tags.split(",").map((tag: string) => tag.trim())
          : tags || [];
    }
    if (availableSlots) {
      resturant.availableSlots =
        typeof availableSlots === "string"
          ? availableSlots.split(",").map((slot: string) => slot.trim())
          : availableSlots || ["17:00", "18:00", "19:00", "20:00", "21:00"];
    }
    if (totalSeats) resturant.totalSeats = Number(totalSeats);

    // Handle image upload if provided
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      resturant.image = result.secure_url;
    }

    const updated = await resturant.save();
    res.json(updated);

  } catch (error: any) {
    console.error("Error updating owner's resturant: ", error);
    res.status(400).json({ error: error.message || "Internal Server Error" });
  }
};

// Delete owner's resturant
// DELETE /api/owner/resturant
export const deleteOwnerResturant = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
  } catch (error: any) {
    console.error("Error deleting owner's resturant: ", error);
    res.status(400).json({ error: error.message || "Internal Server Error" });
  }
};

// Get bookings for owner's resturant
// GET /api/owner/bookings
export const getOwnerBookings = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const resturant = await Resturant.findOne({ owner: req.user?._id });
    if (!resturant) {
      res.status(404).json({ message: "Resturant not found" });
      return;
    }

    const bookings = await Booking.find({ resturant: resturant._id }).populate("user", "name email phone").sort({ date: -1, time: -1 });
    res.json(bookings);
  } catch (error: any) {
    console.error("Error getting owner's resturant bookings: ", error);
    res.status(400).json({ error: error.message || "Internal Server Error" });
  }
};

// Update status of a booking
// PUT /api/owner/bookings/:id/status
export const updateBookingStatus = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const {status} = req.body;
    if(!status || !["confirmed", "cancelled", "completed"].includes(status)) {
      res.status(400).json({ message: "Invalid status value" });
      return;
    }

    const booking = await Booking.findById(req.params.id);
    if(!booking) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }

    // Check if the booking belongs to the owner's resturant
    const resturant = await Resturant.findById(booking.resturant);
    if(!resturant || resturant.owner.toString() !== req.user?._id.toString()) {
      res.status(403).json({ message: "You are not authorized to update this booking" });
      return;
    }

    booking.status = status as "confirmed" | "cancelled" | "completed";
    const updatedBooking = await booking.save();
    res.json(updatedBooking);
  } catch (error: any) {
    console.error("Error updating owner's resturant booking status: ", error);
    res.status(400).json({ error: error.message || "Internal Server Error" });
  }
};
