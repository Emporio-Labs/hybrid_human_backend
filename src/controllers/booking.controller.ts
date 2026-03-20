import type { RequestHandler } from "express";
import mongoose from "mongoose";
import Booking from "../models/Bookings";
import {
	changeBookingStatusBodySchema,
	createBookingBodySchema,
	updateBookingBodySchema,
} from "../validators/booking.validator";

const getIdParam = (idParam: string | string[] | undefined): string | null => {
	if (
		typeof idParam !== "string" ||
		!mongoose.Types.ObjectId.isValid(idParam)
	) {
		return null;
	}

	return idParam;
};

const getRequiredAuthenticatedUser = (req: Parameters<RequestHandler>[0]) => {
	if (!req.user) {
		return null;
	}

	return req.user;
};

export const createBooking: RequestHandler = async (req, res, next) => {
	const parsedBody = createBookingBodySchema.safeParse(req.body);

	if (!parsedBody.success) {
		res.status(400).json({
			message: "Invalid booking payload",
			errors: parsedBody.error.issues,
		});
		return;
	}

	const requester = getRequiredAuthenticatedUser(req);

	if (!requester) {
		res.status(401).json({ message: "Unauthorized" });
		return;
	}

	const { bookingDate, userId, slotId, serviceId, reportId } = parsedBody.data;
	const targetUserId = requester.role === "user" ? requester.id : userId;

	if (!targetUserId) {
		res.status(400).json({ message: "userId is required for admin bookings" });
		return;
	}

	if (
		!mongoose.Types.ObjectId.isValid(targetUserId) ||
		!mongoose.Types.ObjectId.isValid(slotId) ||
		!mongoose.Types.ObjectId.isValid(serviceId) ||
		(reportId && !mongoose.Types.ObjectId.isValid(reportId))
	) {
		res.status(400).json({ message: "Invalid booking references" });
		return;
	}

	try {
		const booking = await Booking.create({
			bookingDate,
			user: targetUserId,
			slot: slotId,
			service: serviceId,
			...(reportId ? { report: reportId } : {}),
		});

		res.status(201).json({ message: "Booking created", booking });
	} catch (error) {
		next(error);
	}
};

export const getAllBookings: RequestHandler = async (_req, res, next) => {
	try {
		const bookings = await Booking.find();
		res.status(200).json({ bookings });
	} catch (error) {
		next(error);
	}
};

export const getBookingById: RequestHandler = async (req, res, next) => {
	const id = getIdParam(req.params.id);

	if (!id) {
		res.status(400).json({ message: "Invalid booking id" });
		return;
	}

	try {
		const booking = await Booking.findById(id);

		if (!booking) {
			res.status(404).json({ message: "Booking not found" });
			return;
		}

		res.status(200).json({ booking });
	} catch (error) {
		next(error);
	}
};

export const getMyBookings: RequestHandler = async (req, res, next) => {
	const requester = getRequiredAuthenticatedUser(req);

	if (!requester) {
		res.status(401).json({ message: "Unauthorized" });
		return;
	}

	if (requester.role !== "user") {
		res.status(403).json({ message: "Forbidden" });
		return;
	}

	try {
		const bookings = await Booking.find({ user: requester.id });
		res.status(200).json({ bookings });
	} catch (error) {
		next(error);
	}
};

export const updateBookingById: RequestHandler = async (req, res, next) => {
	const id = getIdParam(req.params.id);

	if (!id) {
		res.status(400).json({ message: "Invalid booking id" });
		return;
	}

	const parsedBody = updateBookingBodySchema.safeParse(req.body);

	if (!parsedBody.success) {
		res.status(400).json({
			message: "Invalid booking update payload",
			errors: parsedBody.error.issues,
		});
		return;
	}

	const { bookingDate, slotId, serviceId, reportId } = parsedBody.data;

	if (
		(slotId && !mongoose.Types.ObjectId.isValid(slotId)) ||
		(serviceId && !mongoose.Types.ObjectId.isValid(serviceId)) ||
		(reportId && !mongoose.Types.ObjectId.isValid(reportId))
	) {
		res.status(400).json({ message: "Invalid booking references" });
		return;
	}

	try {
		const updatedBooking = await Booking.findByIdAndUpdate(
			id,
			{
				...(bookingDate ? { bookingDate } : {}),
				...(slotId ? { slot: slotId } : {}),
				...(serviceId ? { service: serviceId } : {}),
				...(reportId ? { report: reportId } : {}),
			},
			{
				new: true,
				runValidators: true,
			},
		);

		if (!updatedBooking) {
			res.status(404).json({ message: "Booking not found" });
			return;
		}

		res
			.status(200)
			.json({ message: "Booking updated", booking: updatedBooking });
	} catch (error) {
		next(error);
	}
};

export const deleteBookingById: RequestHandler = async (req, res, next) => {
	const id = getIdParam(req.params.id);

	if (!id) {
		res.status(400).json({ message: "Invalid booking id" });
		return;
	}

	try {
		const deletedBooking = await Booking.findByIdAndDelete(id);

		if (!deletedBooking) {
			res.status(404).json({ message: "Booking not found" });
			return;
		}

		res.status(200).json({ message: "Booking deleted" });
	} catch (error) {
		next(error);
	}
};

export const changeBookingStatus: RequestHandler = async (req, res, next) => {
	const id = getIdParam(req.params.id);

	if (!id) {
		res.status(400).json({ message: "Invalid booking id" });
		return;
	}

	const parsedBody = changeBookingStatusBodySchema.safeParse(req.body);

	if (!parsedBody.success) {
		res.status(400).json({
			message: "Invalid booking status payload",
			errors: parsedBody.error.issues,
		});
		return;
	}

	try {
		const updatedBooking = await Booking.findByIdAndUpdate(
			id,
			{ status: parsedBody.data.status },
			{ new: true, runValidators: true },
		);

		if (!updatedBooking) {
			res.status(404).json({ message: "Booking not found" });
			return;
		}

		res
			.status(200)
			.json({ message: "Booking status changed", booking: updatedBooking });
	} catch (error) {
		next(error);
	}
};
