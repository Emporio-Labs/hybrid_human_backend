import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
	{
		name: { type: String, required: true },
		description: { type: String, required: true },
		credits: { type: Number, required: true },
		tags: { type: [String], default: [] },
	},
	{ timestamps: true },
);

export default mongoose.model("Plan", planSchema);
