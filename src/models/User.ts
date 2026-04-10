import mongoose from "mongoose";
import { Gender } from "./Enums";

const userSchema = new mongoose.Schema(
	{
		username: { type: String, required: true },
		phone: { type: String, required: true },
		email: { type: String, required: true },
		age: { type: String, required: true },
		gender: { type: String, enum: Object.values(Gender), required: true },
		healthGoals: { type: [String], default: [] },
		passwordHash: { type: String, required: true, select: false },
		onboarded: { type: Boolean, default: false },
	},
	{ timestamps: true },
);

export default (mongoose.models.User as mongoose.Model<any>) ||
	mongoose.model("User", userSchema);
