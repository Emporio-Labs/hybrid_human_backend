import type { RequestHandler } from "express";
import mongoose from "mongoose";
import Service from "../models/Service";
import {
	createServiceBodySchema,
	updateServiceBodySchema,
} from "../validators/service.validator";

const getIdParam = (idParam: string | string[] | undefined): string | null => {
	if (
		typeof idParam !== "string" ||
		!mongoose.Types.ObjectId.isValid(idParam)
	) {
		return null;
	}

	return idParam;
};

export const createService: RequestHandler = async (req, res, next) => {
	const parsedBody = createServiceBodySchema.safeParse(req.body);

	if (!parsedBody.success) {
		res.status(400).json({
			message: "Invalid service payload",
			errors: parsedBody.error.issues,
		});
		return;
	}

	const { slotIds, ...rest } = parsedBody.data;

	const invalidSlotId = slotIds.find(
		(id) => !mongoose.Types.ObjectId.isValid(id),
	);

	if (invalidSlotId) {
		res.status(400).json({ message: `Invalid slot id: ${invalidSlotId}` });
		return;
	}

	try {
		const service = await Service.create({ ...rest, slots: slotIds });
		res.status(201).json({ message: "Service created", service });
	} catch (error) {
		next(error);
	}
};

export const getAllServices: RequestHandler = async (_req, res, next) => {
	try {
		const services = await Service.find().populate("slots");
		res.status(200).json({ services });
	} catch (error) {
		next(error);
	}
};

export const getServiceById: RequestHandler = async (req, res, next) => {
	const id = getIdParam(req.params.id);

	if (!id) {
		res.status(400).json({ message: "Invalid service id" });
		return;
	}

	try {
		const service = await Service.findById(id).populate("slots");

		if (!service) {
			res.status(404).json({ message: "Service not found" });
			return;
		}

		res.status(200).json({ service });
	} catch (error) {
		next(error);
	}
};

export const updateServiceById: RequestHandler = async (req, res, next) => {
	const id = getIdParam(req.params.id);

	if (!id) {
		res.status(400).json({ message: "Invalid service id" });
		return;
	}

	const parsedBody = updateServiceBodySchema.safeParse(req.body);

	if (!parsedBody.success) {
		res.status(400).json({
			message: "Invalid service update payload",
			errors: parsedBody.error.issues,
		});
		return;
	}

	const { slotIds, ...rest } = parsedBody.data;

	if (slotIds !== undefined) {
		const invalidSlotId = slotIds.find(
			(id) => !mongoose.Types.ObjectId.isValid(id),
		);

		if (invalidSlotId) {
			res.status(400).json({ message: `Invalid slot id: ${invalidSlotId}` });
			return;
		}
	}

	const updatePayload =
		slotIds !== undefined ? { ...rest, slots: slotIds } : rest;

	try {
		const updatedService = await Service.findByIdAndUpdate(id, updatePayload, {
			new: true,
			runValidators: true,
		}).populate("slots");

		if (!updatedService) {
			res.status(404).json({ message: "Service not found" });
			return;
		}

		res
			.status(200)
			.json({ message: "Service updated", service: updatedService });
	} catch (error) {
		next(error);
	}
};

export const deleteServiceById: RequestHandler = async (req, res, next) => {
	const id = getIdParam(req.params.id);

	if (!id) {
		res.status(400).json({ message: "Invalid service id" });
		return;
	}

	try {
		const deletedService = await Service.findByIdAndDelete(id);

		if (!deletedService) {
			res.status(404).json({ message: "Service not found" });
			return;
		}

		res.status(200).json({ message: "Service deleted" });
	} catch (error) {
		next(error);
	}
};
