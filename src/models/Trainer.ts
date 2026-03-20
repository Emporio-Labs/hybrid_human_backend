import mongoose from "mongoose";

const trainerSchema = new mongoose.Schema(
	{
		trainerName: { type: String, required: true },
		email: { type: String, required: true },
		phone: { type: String, required: true },
		description: { type: String, default: "" },
		specialities: { type: [String], default: [] },
	},
	{ timestamps: true },
);

export default mongoose.model("Doctor", trainerSchema);
