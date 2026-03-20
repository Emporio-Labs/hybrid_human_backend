import type { RequestHandler } from "express";
import mongoose from "mongoose";
import Doctor from "../models/Doctor";
import {
	createDoctorBodySchema,
	updateDoctorBodySchema,
} from "../validators/doctor.validator";

const getIdParam = (idParam: string | string[] | undefined): string | null => {
	if (
		typeof idParam !== "string" ||
		!mongoose.Types.ObjectId.isValid(idParam)
	) {
		return null;
	}

	return idParam;
};

export const createDoctor: RequestHandler = async (req, res, next) => {
	const parsedBody = createDoctorBodySchema.safeParse(req.body);

	if (!parsedBody.success) {
		res.status(400).json({
			message: "Invalid doctor payload",
			errors: parsedBody.error.issues,
		});
		return;
	}

	try {
		const { password, ...rest } = parsedBody.data;
		const doctor = await Doctor.create({
			...rest,
			passwordHash: password,
		});
		res.status(201).json({ message: "Doctor created", doctor });
	} catch (error) {
		next(error);
	}
};

export const getAllDoctors: RequestHandler = async (_req, res, next) => {
	try {
		const doctors = await Doctor.find();
		res.status(200).json({ doctors });
	} catch (error) {
		next(error);
	}
};

export const getDoctorById: RequestHandler = async (req, res, next) => {
	const id = getIdParam(req.params.id);

	if (!id) {
		res.status(400).json({ message: "Invalid doctor id" });
		return;
	}

	try {
		const doctor = await Doctor.findById(id);

		if (!doctor) {
			res.status(404).json({ message: "Doctor not found" });
			return;
		}

		res.status(200).json({ doctor });
	} catch (error) {
		next(error);
	}
};

export const updateDoctorById: RequestHandler = async (req, res, next) => {
	const id = getIdParam(req.params.id);

	if (!id) {
		res.status(400).json({ message: "Invalid doctor id" });
		return;
	}

	const parsedBody = updateDoctorBodySchema.safeParse(req.body);

	if (!parsedBody.success) {
		res.status(400).json({
			message: "Invalid doctor update payload",
			errors: parsedBody.error.issues,
		});
		return;
	}

	const { password, ...rest } = parsedBody.data;
	const updatePayload = {
		...rest,
		...(password ? { passwordHash: password } : {}),
	};

	try {
		const updatedDoctor = await Doctor.findByIdAndUpdate(id, updatePayload, {
			new: true,
			runValidators: true,
		});

		if (!updatedDoctor) {
			res.status(404).json({ message: "Doctor not found" });
			return;
		}

		res.status(200).json({ message: "Doctor updated", doctor: updatedDoctor });
	} catch (error) {
		next(error);
	}
};

export const deleteDoctorById: RequestHandler = async (req, res, next) => {
	const id = getIdParam(req.params.id);

	if (!id) {
		res.status(400).json({ message: "Invalid doctor id" });
		return;
	}

	try {
		const deletedDoctor = await Doctor.findByIdAndDelete(id);

		if (!deletedDoctor) {
			res.status(404).json({ message: "Doctor not found" });
			return;
		}

		res.status(200).json({ message: "Doctor deleted" });
	} catch (error) {
		next(error);
	}
};
