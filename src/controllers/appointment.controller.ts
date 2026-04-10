import type { RequestHandler } from "express";
import mongoose from "mongoose";
import Appointment from "../models/Appointment";
import Doctor from "../models/Doctor";
import {
	changeAppointmentStatusBodySchema,
	createAppointmentBodySchema,
	updateAppointmentBodySchema,
} from "../validators/appointment.validator";

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

const getDoctorIdForRequester = async (
	requesterId: string,
): Promise<string | null> => {
	const doctor = await Doctor.findOne({ _id: requesterId }).select("_id");
	if (!doctor) {
		return null;
	}

	return doctor._id.toString();
};

export const createAppointment: RequestHandler = async (req, res, next) => {
	const parsedBody = createAppointmentBodySchema.safeParse(req.body);

	if (!parsedBody.success) {
		res.status(400).json({
			message: "Invalid appointment payload",
			errors: parsedBody.error.issues,
		});
		return;
	}

	const { appointmentDate, userId, slotId, doctorId, reportId } =
		parsedBody.data;

	if (
		!mongoose.Types.ObjectId.isValid(userId) ||
		!mongoose.Types.ObjectId.isValid(slotId) ||
		!mongoose.Types.ObjectId.isValid(doctorId) ||
		(reportId && !mongoose.Types.ObjectId.isValid(reportId))
	) {
		res.status(400).json({ message: "Invalid appointment references" });
		return;
	}

	try {
		const appointment = await Appointment.create({
			appointmentDate,
			user: userId,
			slot: slotId,
			doctor: doctorId,
			...(reportId ? { report: reportId } : {}),
		});

		res.status(201).json({ message: "Appointment created", appointment });
	} catch (error) {
		next(error);
	}
};

export const getAllAppointments: RequestHandler = async (_req, res, next) => {
	try {
		const appointments = await Appointment.find();
		res.status(200).json({ appointments });
	} catch (error) {
		next(error);
	}
};

export const getAppointmentById: RequestHandler = async (req, res, next) => {
	const id = getIdParam(req.params.id);

	if (!id) {
		res.status(400).json({ message: "Invalid appointment id" });
		return;
	}

	try {
		const appointment = await Appointment.findById(id);

		if (!appointment) {
			res.status(404).json({ message: "Appointment not found" });
			return;
		}

		res.status(200).json({ appointment });
	} catch (error) {
		next(error);
	}
};

export const getMyAppointments: RequestHandler = async (req, res, next) => {
	const requester = getRequiredAuthenticatedUser(req);

	if (!requester) {
		res.status(401).json({ message: "Unauthorized" });
		return;
	}

	if (requester.role !== "doctor") {
		res.status(403).json({ message: "Forbidden" });
		return;
	}

	try {
		const appointments = await Appointment.find({ doctor: requester.id });
		res.status(200).json({ appointments });
	} catch (error) {
		next(error);
	}
};

export const updateAppointmentById: RequestHandler = async (req, res, next) => {
	const id = getIdParam(req.params.id);

	if (!id) {
		res.status(400).json({ message: "Invalid appointment id" });
		return;
	}

	const parsedBody = updateAppointmentBodySchema.safeParse(req.body);

	if (!parsedBody.success) {
		res.status(400).json({
			message: "Invalid appointment update payload",
			errors: parsedBody.error.issues,
		});
		return;
	}

	const { appointmentDate, slotId, doctorId, reportId } = parsedBody.data;

	if (
		(slotId && !mongoose.Types.ObjectId.isValid(slotId)) ||
		(doctorId && !mongoose.Types.ObjectId.isValid(doctorId)) ||
		(reportId && !mongoose.Types.ObjectId.isValid(reportId))
	) {
		res.status(400).json({ message: "Invalid appointment references" });
		return;
	}

	try {
		const updatedAppointment = await Appointment.findByIdAndUpdate(
			id,
			{
				...(appointmentDate ? { appointmentDate } : {}),
				...(slotId ? { slot: slotId } : {}),
				...(doctorId ? { doctor: doctorId } : {}),
				...(reportId ? { report: reportId } : {}),
			},
			{ returnDocument: "after", runValidators: true },
		);

		if (!updatedAppointment) {
			res.status(404).json({ message: "Appointment not found" });
			return;
		}

		res.status(200).json({
			message: "Appointment updated",
			appointment: updatedAppointment,
		});
	} catch (error) {
		next(error);
	}
};

export const deleteAppointmentById: RequestHandler = async (req, res, next) => {
	const id = getIdParam(req.params.id);

	if (!id) {
		res.status(400).json({ message: "Invalid appointment id" });
		return;
	}

	try {
		const deletedAppointment = await Appointment.findByIdAndDelete(id);

		if (!deletedAppointment) {
			res.status(404).json({ message: "Appointment not found" });
			return;
		}

		res.status(200).json({ message: "Appointment deleted" });
	} catch (error) {
		next(error);
	}
};

export const changeAppointmentStatus: RequestHandler = async (
	req,
	res,
	next,
) => {
	const id = getIdParam(req.params.id);

	if (!id) {
		res.status(400).json({ message: "Invalid appointment id" });
		return;
	}

	const parsedBody = changeAppointmentStatusBodySchema.safeParse(req.body);

	if (!parsedBody.success) {
		res.status(400).json({
			message: "Invalid appointment status payload",
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
		const appointment = await Appointment.findById(id);

		if (!appointment) {
			res.status(404).json({ message: "Appointment not found" });
			return;
		}

		if (requester.role === "doctor") {
			const requesterDoctorId = await getDoctorIdForRequester(requester.id);

			if (
				!requesterDoctorId ||
				appointment.doctor.toString() !== requesterDoctorId
			) {
				res.status(403).json({ message: "Forbidden" });
				return;
			}
		}

		appointment.status = parsedBody.data.status;
		await appointment.save();

		res
			.status(200)
			.json({ message: "Appointment status changed", appointment });
	} catch (error) {
		next(error);
	}
};
