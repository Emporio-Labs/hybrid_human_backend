import type { RequestHandler } from "express";
import mongoose from "mongoose";
import Booking from "../models/Bookings";
import { BookingStatus, CreditTransactionSource } from "../models/Enums";
import Service from "../models/Service";
import Slot from "../models/Slots";
import {
	CreditServiceError,
	consumeCredits,
	refundCreditsBySource,
} from "../utils/credit.service";
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

const isCancelledBookingStatus = (status: unknown): boolean =>
	status === BookingStatus.Cancelled ||
	status === String(BookingStatus.Cancelled) ||
	status === "Cancelled";

const mapCreditServiceError = (
	error: CreditServiceError,
): { status: number; message: string } => {
	switch (error.code) {
		case "NO_ACTIVE_MEMBERSHIP":
			return {
				status: 403,
				message: "No active membership with available credits",
			};
		case "INSUFFICIENT_CREDITS":
			return { status: 402, message: "Insufficient credits" };
		default:
			return { status: 400, message: error.message };
	}
};

const normalizeToUtcDate = (value: Date): Date =>
	new Date(
		Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
	);

const isSameUtcDate = (left: Date, right: Date): boolean =>
	normalizeToUtcDate(left).getTime() === normalizeToUtcDate(right).getTime();

const isSlotLinkedToService = (
	serviceSlotIds: Array<mongoose.Types.ObjectId>,
	slot: {
		_id: mongoose.Types.ObjectId;
		parentTemplate?: mongoose.Types.ObjectId | null;
	},
): boolean => {
	const linkedSlotId = slot.parentTemplate
		? slot.parentTemplate.toString()
		: slot._id.toString();

	return serviceSlotIds.some((serviceSlotId) =>
		serviceSlotId.toString() === linkedSlotId,
	);
};

const resolveConcreteSlotForBooking = async (
	slot: {
		_id: mongoose.Types.ObjectId;
		date?: Date | null;
		isDaily?: boolean;
		startTime: string;
		endTime: string;
		capacity?: number;
		parentTemplate?: mongoose.Types.ObjectId | null;
	},
	bookingDate: Date,
) => {
	const bookingDay = normalizeToUtcDate(bookingDate);

	if (slot.parentTemplate) {
		if (!slot.date || !isSameUtcDate(slot.date, bookingDay)) {
			return null;
		}

		return slot;
	}

	if (slot.isDaily) {
		const templateCapacity = Math.max(1, Number(slot.capacity ?? 1));

		const concreteSlot = await Slot.findOneAndUpdate(
			{
				parentTemplate: slot._id,
				date: bookingDay,
				startTime: slot.startTime,
				endTime: slot.endTime,
			},
			{
				$setOnInsert: {
					date: bookingDay,
					isDaily: false,
					startTime: slot.startTime,
					endTime: slot.endTime,
					capacity: templateCapacity,
					remainingCapacity: templateCapacity,
					isBooked: templateCapacity <= 0,
					parentTemplate: slot._id,
				},
			},
			{
				upsert: true,
				setDefaultsOnInsert: true,
				returnDocument: "after",
			},
		);

		return concreteSlot;
	}

	if (!slot.date || !isSameUtcDate(slot.date, bookingDay)) {
		return null;
	}

	return slot;
};

const reserveSlotCapacity = async (slotId: string) => {
	let reservedSlot = await Slot.findOneAndUpdate(
		{ _id: slotId, remainingCapacity: { $gt: 0 } },
		{ $inc: { remainingCapacity: -1 } },
		{ returnDocument: "after" },
	);

	if (!reservedSlot) {
		return null;
	}

	const derivedBooked = Number(reservedSlot.remainingCapacity ?? 0) <= 0;

	if (reservedSlot.isBooked !== derivedBooked) {
		const syncedSlot = await Slot.findByIdAndUpdate(
			slotId,
			{ isBooked: derivedBooked },
			{ returnDocument: "after" },
		);

		if (syncedSlot) {
			reservedSlot = syncedSlot;
		}
	}

	return reservedSlot;
};

const releaseSlotCapacity = async (slotId: string): Promise<void> => {
	const slot = await Slot.findById(slotId);

	if (!slot) {
		return;
	}

	const capacity = Math.max(1, Number(slot.capacity ?? 1));
	const remainingCapacity = Math.max(
		0,
		Math.min(capacity, Number(slot.remainingCapacity ?? 0) + 1),
	);

	slot.capacity = capacity;
	slot.remainingCapacity = remainingCapacity;
	slot.isBooked = remainingCapacity <= 0;

	await slot.save();
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

	const { bookingDate, userId, slotId, serviceId, reportId, bypassCredits } =
		parsedBody.data;
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

	if (bypassCredits && requester.role !== "admin") {
		res
			.status(403)
			.json({ message: "Only admins can bypass credit consumption" });
		return;
	}

	let reservedSlotId: string | null = null;

	try {
		const service = await Service.findById(serviceId).select(
			"_id creditCost slots",
		);

		if (!service) {
			res.status(404).json({ message: "Service not found" });
			return;
		}

		const requestedSlot = await Slot.findById(slotId).select(
			"_id date isDaily startTime endTime capacity remainingCapacity isBooked parentTemplate",
		);

		if (!requestedSlot || !isSlotLinkedToService(service.slots, requestedSlot)) {
			res.status(409).json({ message: "Slot is full or no longer available" });
			return;
		}

		const concreteSlot = await resolveConcreteSlotForBooking(
			requestedSlot,
			bookingDate,
		);

		if (!concreteSlot) {
			res.status(409).json({ message: "Slot is full or no longer available" });
			return;
		}

		const reservedSlot = await reserveSlotCapacity(concreteSlot._id.toString());

		if (!reservedSlot) {
			res.status(409).json({ message: "Slot is full or no longer available" });
			return;
		}

		reservedSlotId = reservedSlot._id.toString();

		const creditCost = Math.max(1, Number(service.creditCost ?? 1));

		const booking = await Booking.create({
			bookingDate,
			user: targetUserId,
			slot: reservedSlotId,
			service: serviceId,
			...(reportId ? { report: reportId } : {}),
		});

		if (!bypassCredits) {
			try {
				await consumeCredits({
					userId: targetUserId,
					amount: creditCost,
					sourceType: CreditTransactionSource.Booking,
					sourceId: booking._id.toString(),
					actorId: requester.id,
					actorRole: requester.role,
					reason: `Booking ${booking._id.toString()}`,
				});
			} catch (error) {
				await Booking.findByIdAndDelete(booking._id).catch(() => null);

				if (reservedSlotId) {
					await releaseSlotCapacity(reservedSlotId).catch(() => null);
					reservedSlotId = null;
				}

				if (error instanceof CreditServiceError) {
					const creditError = mapCreditServiceError(error);
					res.status(creditError.status).json({ message: creditError.message });
					return;
				}

				throw error;
			}
		}

		res.status(201).json({
			message: "Booking created",
			booking,
			credits: {
				consumed: bypassCredits ? 0 : creditCost,
				bypassed: bypassCredits,
			},
		});
	} catch (error) {
		if (reservedSlotId) {
			await releaseSlotCapacity(reservedSlotId).catch(() => null);
		}

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
				returnDocument: "after",
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

	const requester = getRequiredAuthenticatedUser(req);

	if (!requester) {
		res.status(401).json({ message: "Unauthorized" });
		return;
	}

	try {
		const booking = await Booking.findById(id);

		if (!booking) {
			res.status(404).json({ message: "Booking not found" });
			return;
		}

		const wasCancelled = isCancelledBookingStatus(booking.status);
		booking.status = parsedBody.data.status;
		await booking.save();

		let refundedCredits = 0;

		if (!wasCancelled && isCancelledBookingStatus(parsedBody.data.status)) {
			await releaseSlotCapacity(booking.slot.toString()).catch(() => null);

			const refundResult = await refundCreditsBySource({
				userId: booking.user.toString(),
				sourceType: CreditTransactionSource.Booking,
				sourceId: booking._id.toString(),
				actorId: requester.id,
				actorRole: requester.role,
				reason: `Booking ${booking._id.toString()} cancelled`,
			});

			refundedCredits = refundResult.refunded;
		}

		res.status(200).json({
			message: "Booking status changed",
			booking,
			credits: { refunded: refundedCredits },
		});
	} catch (error) {
		next(error);
	}
};
