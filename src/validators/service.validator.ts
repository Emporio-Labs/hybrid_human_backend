import z from "zod";

export const createServiceBodySchema = z.object({
	serviceName: z.string().min(1),
	serviceTime: z.number(),
	description: z.string().min(1),
	credits: z.number().positive(),
	tags: z.array(z.string()).default([]),
	slotIds: z.array(z.string().min(1)).default([]),
});

export const updateServiceBodySchema = createServiceBodySchema
	.partial()
	.refine((payload) => Object.keys(payload).length > 0, {
		message: "At least one field is required",
	});

export type CreateServiceBody = z.infer<typeof createServiceBodySchema>;
export type UpdateServiceBody = z.infer<typeof updateServiceBodySchema>;
