import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.js";
import Resturant from "../models/Resturant.js";
import Booking from "../models/Booking.js";

// Create new booking
// POST /api/bookings
// @access Private
export const createBooking = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { resturantId, date, time, guests, occasion, specialRequests } =
      req.body;

    if (!resturantId || !date || !time || !guests) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    // Check if restaurant exists and is approved
    const resturant = await Resturant.findById(resturantId);
    if (!resturant) {
      res.status(404).json({ error: "Restaurant not found" });
      return;
    }
    if (resturant.status !== "approved") {
      res
        .status(400)
        .json({ error: "Restaurant is not approved for bookings" });
      return;
    }

    // Verify seat availability
    const reqeustedGuests = Number(guests);
    const existingBookings = await Booking.find({
      resturant: resturantId,
      date: new Date(date),
      time: time,
      status: "confirmed",
    });
    const totalBookedSeats = existingBookings.reduce(
      (sum, booking) => sum + booking.guests,
      0,
    );
    const totalSeats = resturant.totalSeats || 20;
    const availableSeats = totalSeats - totalBookedSeats;
    if (reqeustedGuests > availableSeats) {
      res.status(400).json({
        error: `Not enough available seats. Only ${availableSeats} seats are available for the selected date and time.`,
      });
      return;
    }

    // Create booking
    const booking = await Booking.create({
      user: req.user?._id,
      resturant: resturantId,
      date: new Date(date),
      time,
      guests: reqeustedGuests,
      occasion,
      specialRequests,
      status: "confirmed",
    });

    // Populate resturant info before returning the response
    const populatedBooking = await booking.populate(
      "resturant",
      "name location image address",
    );

    res.status(201).json(populatedBooking);
  } catch (error: any) {
    console.error("Error creating booking: ", error);
    res.status(400).json({ error: error.message || "Internal Server Error" });
  }
};

// Get logged in user bookings
// GET /api/bookings/my
// @access Private
export const getMyBookings = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const bookings = await Booking.find({ user: req.user?._id })
      .populate("resturant", "name location image address")
      .sort({ date: -1, time: -1 });
    res.status(200).json(bookings);
  } catch (error: any) {
    console.error("Error getting user bookings: ", error);
    res.status(400).json({ error: error.message || "Internal Server Error" });
  }
};

// Cancel a booking
// PUT /api/bookings/:id/cancel
// @access Private
export const cancelBooking = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const bookingId = req.params.id;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      res.status(404).json({ error: "Booking not found" });
      return;
    }

    // Check if the booking belongs to the logged-in user
    if (booking.user.toString() !== req.user?._id.toString()) {
      res
        .status(403)
        .json({ error: "You are not authorized to cancel this booking" });
      return;
    }

    // Update booking status to cancelled
    booking.status = "cancelled";
    await booking.save();

    const populatedBooking = await booking.populate(
      "resturant",
      "name location image address",
    );

    res.status(200).json(populatedBooking);
  } catch (error: any) {
    console.error("Error canceling booking: ", error);
    res.status(400).json({ error: error.message || "Internal Server Error" });
  }
};
