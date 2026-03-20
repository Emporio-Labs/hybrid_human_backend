import type { RequestHandler } from "express";
import mongoose from "mongoose";
import Slot from "../models/Slots";
import {
	createSlotBodySchema,
	updateSlotBodySchema,
} from "../validators/slot.validator";

const getIdParam = (idParam: string | string[] | undefined): string | null => {
	if (
		typeof idParam !== "string" ||
		!mongoose.Types.ObjectId.isValid(idParam)
	) {
		return null;
	}

	return idParam;
};

export const createSlot: RequestHandler = async (req, res, next) => {
	const parsedBody = createSlotBodySchema.safeParse(req.body);

	if (!parsedBody.success) {
		res.status(400).json({
			message: "Invalid slot payload",
			errors: parsedBody.error.issues,
		});
		return;
	}

	try {
		const slot = await Slot.create(parsedBody.data);
		res.status(201).json({ message: "Slot created", slot });
	} catch (error) {
		next(error);
	}
};

export const getAllSlots: RequestHandler = async (_req, res, next) => {
	try {
		const slots = await Slot.find();
		res.status(200).json({ slots });
	} catch (error) {
		next(error);
	}
};

export const getSlotById: RequestHandler = async (req, res, next) => {
	const id = getIdParam(req.params.id);

	if (!id) {
		res.status(400).json({ message: "Invalid slot id" });
		return;
	}

	try {
		const slot = await Slot.findById(id);

		if (!slot) {
			res.status(404).json({ message: "Slot not found" });
			return;
		}

		res.status(200).json({ slot });
	} catch (error) {
		next(error);
	}
};

export const updateSlotById: RequestHandler = async (req, res, next) => {
	const id = getIdParam(req.params.id);

	if (!id) {
		res.status(400).json({ message: "Invalid slot id" });
		return;
	}

	const parsedBody = updateSlotBodySchema.safeParse(req.body);

	if (!parsedBody.success) {
		res.status(400).json({
			message: "Invalid slot update payload",
			errors: parsedBody.error.issues,
		});
		return;
	}

	try {
		const updatedSlot = await Slot.findByIdAndUpdate(id, parsedBody.data, {
			new: true,
			runValidators: true,
		});

		if (!updatedSlot) {
			res.status(404).json({ message: "Slot not found" });
			return;
		}

		res.status(200).json({ message: "Slot updated", slot: updatedSlot });
	} catch (error) {
		next(error);
	}
};

export const deleteSlotById: RequestHandler = async (req, res, next) => {
	const id = getIdParam(req.params.id);

	if (!id) {
		res.status(400).json({ message: "Invalid slot id" });
		return;
	}

	try {
		const deletedSlot = await Slot.findByIdAndDelete(id);

		if (!deletedSlot) {
			res.status(404).json({ message: "Slot not found" });
			return;
		}

		res.status(200).json({ message: "Slot deleted" });
	} catch (error) {
		next(error);
	}
};
