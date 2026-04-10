import mongoose from "mongoose";
import { BookingStatus } from "./Enums";

const appointmentSchema = new mongoose.Schema(
	{
		appointmentDate: { type: Date, required: true },
		status: {
			type: String,
			enum: Object.values(BookingStatus),
			required: true,
			default: BookingStatus.Booked,
		},
		user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
		slot: { type: mongoose.Schema.Types.ObjectId, ref: "Slot", required: true },
		doctor: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Doctor",
			required: true,
		},
		service: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Service",
			default: undefined,
		},
		report: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Report",
			default: "",
		},
	},
	{ timestamps: true },
);

type AppointmentDocument = mongoose.InferSchemaType<typeof appointmentSchema>;

export default (mongoose.models
	.Appointment as mongoose.Model<AppointmentDocument>) ||
	mongoose.model<AppointmentDocument>("Appointment", appointmentSchema);
