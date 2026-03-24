import z from "zod";

export const createPlanBodySchema = z.object({
	name: z.string().min(1),
	description: z.string().min(1),
	credits: z.number().positive(),
	tags: z.array(z.string()).default([]),
});

export const updatePlanBodySchema = createPlanBodySchema
	.partial()
	.refine((payload) => Object.keys(payload).length > 0, {
		message: "At least one field is required",
	});

export type CreatePlanBody = z.infer<typeof createPlanBodySchema>;
export type UpdatePlanBody = z.infer<typeof updatePlanBodySchema>;
