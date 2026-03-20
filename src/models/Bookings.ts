import mongoose from "mongoose";
import { BookingStatus } from "./Enums";

const bookingSchema = new mongoose.Schema(
  {
    bookingDate: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(BookingStatus),
      default: BookingStatus.Booked,
      required: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    slot: { type: mongoose.Schema.Types.ObjectId, ref: "Slot", required: true },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    report: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Report",
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);
