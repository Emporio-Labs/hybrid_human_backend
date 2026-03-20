import z from "zod";

export const createDoctorBodySchema = z.object({
	doctorName: z.string().min(1),
	email: z.string().email(),
	phone: z.string().min(1),
	password: z.string().min(6),
	description: z.string().default(""),
	specialities: z.array(z.string().min(1)).default([]),
});

export const updateDoctorBodySchema = createDoctorBodySchema
	.partial()
	.refine((payload) => Object.keys(payload).length > 0, {
		message: "At least one field is required",
	});

export type CreateDoctorBody = z.infer<typeof createDoctorBodySchema>;
export type UpdateDoctorBody = z.infer<typeof updateDoctorBodySchema>;
