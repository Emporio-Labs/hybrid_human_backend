import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
	{
		doctorName: { type: String, required: true },
		email: { type: String, required: true },
		phone: { type: String, required: true },
		passwordHash: { type: String, required: true, select: false },
		description: { type: String, default: "" },
		specialities: { type: [String], default: [] },
	},
	{ timestamps: true },
);

export default mongoose.model("Doctor", doctorSchema);
