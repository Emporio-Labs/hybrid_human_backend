import z from "zod";
import { BookingStatus } from "../models/Enums";

export const createBookingBodySchema = z.object({
	bookingDate: z.coerce.date(),
	userId: z.string().min(1).optional(),
	slotId: z.string().min(1),
	serviceId: z.string().min(1),
	reportId: z.string().min(1).optional(),
});

export const updateBookingBodySchema = z
	.object({
		bookingDate: z.coerce.date().optional(),
		slotId: z.string().min(1).optional(),
		serviceId: z.string().min(1).optional(),
		reportId: z.string().min(1).optional(),
	})
	.refine((payload) => Object.keys(payload).length > 0, {
		message: "At least one field is required",
	});

export const changeBookingStatusBodySchema = z.object({
	status: z.coerce.number().refine((value) => value in BookingStatus, {
		message: "Invalid booking status",
	}),
});

export type CreateBookingBody = z.infer<typeof createBookingBodySchema>;
export type UpdateBookingBody = z.infer<typeof updateBookingBodySchema>;
export type ChangeBookingStatusBody = z.infer<
	typeof changeBookingStatusBodySchema
>;
