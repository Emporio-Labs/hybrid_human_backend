import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
	{
		serviceName: { type: String, required: true },
		serviceTime: { type: Number, required: true },
		creditCost: { type: Number, required: true, min: 1, default: 1 },
		description: { type: String, required: true },
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

type ServiceDocument = mongoose.InferSchemaType<typeof serviceSchema>;

export default (mongoose.models.Service as mongoose.Model<ServiceDocument>) ||
	mongoose.model<ServiceDocument>("Service", serviceSchema);
