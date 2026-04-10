import mongoose from "mongoose";
import { MembershipStatus } from "./Enums";

const membershipSchema = new mongoose.Schema(
	{
		user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
		planName: { type: String, required: true },
		status: {
			type: String,
			enum: Object.values(MembershipStatus),
			default: MembershipStatus.Active,
			required: true,
		},
		price: { type: Number, required: true, min: 0 },
		currency: { type: String, default: "USD" },
		startDate: { type: Date, required: true },
		endDate: { type: Date },
		features: { type: [String], default: [] },
		notes: { type: String, default: "" },
	},
	{ timestamps: true },
);

export default (mongoose.models.Membership as mongoose.Model<any>) ||
	mongoose.model("Membership", membershipSchema);
