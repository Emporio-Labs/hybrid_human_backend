import z from "zod";

export const createSlotBodySchema = z.object({
	date: z.coerce.date(),
	startTime: z.string().min(1),
	endTime: z.string().min(1),
	isBooked: z.boolean().default(false),
});

export const updateSlotBodySchema = createSlotBodySchema
	.partial()
	.refine((payload) => Object.keys(payload).length > 0, {
		message: "At least one field is required",
	});

export type CreateSlotBody = z.infer<typeof createSlotBodySchema>;
export type UpdateSlotBody = z.infer<typeof updateSlotBodySchema>;
