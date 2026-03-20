import z from "zod";

export const createUserBodySchema = z.object({
	username: z.string().min(1),
	phone: z.string().min(1),
	email: z.string().email(),
	age: z.string().min(1),
	gender: z.string().min(1),
	healthGoals: z.array(z.string().min(1)).default([]),
	password: z.string().min(6),
});

export const updateUserBodySchema = createUserBodySchema
	.partial()
	.refine((payload) => Object.keys(payload).length > 0, {
		message: "At least one field is required",
	});

export type CreateUserBody = z.infer<typeof createUserBodySchema>;
export type UpdateUserBody = z.infer<typeof updateUserBodySchema>;
