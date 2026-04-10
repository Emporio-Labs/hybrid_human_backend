import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
	{
		adminName: { type: String, required: true },
		email: { type: String, required: true },
		phone: { type: String, required: true },
		passwordHash: { type: String, required: true, select: false },
	},
	{ timestamps: true },
);

export default mongoose.model("Admin", adminSchema);
