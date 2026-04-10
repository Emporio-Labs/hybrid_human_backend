import mongoose from "mongoose";

const slotSchema = new mongoose.Schema(
	{
		date: { type: Date, required: true },
		startTime: { type: String, required: true },
		endTime: { type: String, required: true },
		isBooked: { type: Boolean, requried: true },
	},
	{ timestamps: true },
);

export default (mongoose.models.Slot as mongoose.Model<any>) ||
	mongoose.model("Slot", slotSchema);
