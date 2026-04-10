import z from "zod";
import { BookingStatus } from "../models/Enums";

export const createAppointmentBodySchema = z.object({
	appointmentDate: z.coerce.date(),
	userId: z.string().min(1),
	slotId: z.string().min(1),
	doctorId: z.string().min(1),
	serviceId: z.string().min(1).optional(),
	reportId: z.string().min(1).optional(),
	bypassCredits: z.coerce.boolean().optional().default(false),
});

export const updateAppointmentBodySchema = z
	.object({
		appointmentDate: z.coerce.date().optional(),
		slotId: z.string().min(1).optional(),
		doctorId: z.string().min(1).optional(),
		serviceId: z.string().min(1).optional(),
		reportId: z.string().min(1).optional(),
	})
	.refine((payload) => Object.keys(payload).length > 0, {
		message: "At least one field is required",
	});

export const changeAppointmentStatusBodySchema = z.object({
	status: z.coerce.number().refine((value) => value in BookingStatus, {
		message: "Invalid appointment status",
	}),
});

export type CreateAppointmentBody = z.infer<typeof createAppointmentBodySchema>;
export type UpdateAppointmentBody = z.infer<typeof updateAppointmentBodySchema>;
export type ChangeAppointmentStatusBody = z.infer<
	typeof changeAppointmentStatusBodySchema
>;
