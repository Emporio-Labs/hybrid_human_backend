import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
	{
		serviceName: { type: String, required: true },
		serviceTime: { type: Number, required: true },
		description: { type: String, required: true },
		credits: { type: Number, required: true, min: 1 },
		tags: { type: [String], default: [] },
		slots: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Slot",
				required: true,
			},
		],
	},
	{ timestamps: true },
);

export default mongoose.model("Service", serviceSchema);
