import {Schema, model, Document, Types} from 'mongoose';
import crypto from 'crypto';

export interface IBooking extends Document {
    user: Types.ObjectId;
    resturant: Types.ObjectId;
    date: Date;
    time: string;
    guests: number;
    occasion?: string;
    specialRequests?: string;
    status: "confirmed" | "cancelled" | "completed";
    bookingId: string;
    createdAt: Date;
    updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>({
    user: { type: Types.ObjectId, ref: 'User', required: true },
    resturant: { type: Types.ObjectId, ref: 'Resturant', required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    guests: { type: Number, required: true, min: 1 },
    occasion: { type: String, trim: true },
    specialRequests: { type: String, trim: true },
    status: { type: String, enum: ["confirmed", "cancelled", "completed"], default: "confirmed" },
    bookingId: { type: String, unique: true }
}, {
    timestamps: true
});

// Auto generate refernce code on save
BookingSchema.pre<IBooking>('save', function() {
    if(!this.bookingId) {
        this.bookingId = `GR-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    }
})  

const Booking = model<IBooking>('Booking', BookingSchema);

export default Booking;