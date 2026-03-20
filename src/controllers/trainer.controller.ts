import type { RequestHandler } from "express";
import mongoose from "mongoose";
import Trainer from "../models/Trainer";
import {
	createTrainerBodySchema,
	updateTrainerBodySchema,
} from "../validators/trainer.validator";

const getIdParam = (idParam: string | string[] | undefined): string | null => {
	if (
		typeof idParam !== "string" ||
		!mongoose.Types.ObjectId.isValid(idParam)
	) {
		return null;
	}

	return idParam;
};

export const createTrainer: RequestHandler = async (req, res, next) => {
	const parsedBody = createTrainerBodySchema.safeParse(req.body);

	if (!parsedBody.success) {
		res.status(400).json({
			message: "Invalid trainer payload",
			errors: parsedBody.error.issues,
		});
		return;
	}

	try {
		const { password, ...rest } = parsedBody.data;
		const trainer = await Trainer.create({
			...rest,
			passwordHash: password,
		});
		res.status(201).json({ message: "Trainer created", trainer });
	} catch (error) {
		next(error);
	}
};

export const getAllTrainers: RequestHandler = async (_req, res, next) => {
	try {
		const trainers = await Trainer.find();
		res.status(200).json({ trainers });
	} catch (error) {
		next(error);
	}
};

export const getTrainerById: RequestHandler = async (req, res, next) => {
	const id = getIdParam(req.params.id);

	if (!id) {
		res.status(400).json({ message: "Invalid trainer id" });
		return;
	}

	try {
		const trainer = await Trainer.findById(id);

		if (!trainer) {
			res.status(404).json({ message: "Trainer not found" });
			return;
		}

		res.status(200).json({ trainer });
	} catch (error) {
		next(error);
	}
};

export const updateTrainerById: RequestHandler = async (req, res, next) => {
	const id = getIdParam(req.params.id);

	if (!id) {
		res.status(400).json({ message: "Invalid trainer id" });
		return;
	}

	const parsedBody = updateTrainerBodySchema.safeParse(req.body);

	if (!parsedBody.success) {
		res.status(400).json({
			message: "Invalid trainer update payload",
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
		const updatedTrainer = await Trainer.findByIdAndUpdate(id, updatePayload, {
			new: true,
			runValidators: true,
		});

		if (!updatedTrainer) {
			res.status(404).json({ message: "Trainer not found" });
			return;
		}

		res
			.status(200)
			.json({ message: "Trainer updated", trainer: updatedTrainer });
	} catch (error) {
		next(error);
	}
};

export const deleteTrainerById: RequestHandler = async (req, res, next) => {
	const id = getIdParam(req.params.id);

	if (!id) {
		res.status(400).json({ message: "Invalid trainer id" });
		return;
	}

	try {
		const deletedTrainer = await Trainer.findByIdAndDelete(id);

		if (!deletedTrainer) {
			res.status(404).json({ message: "Trainer not found" });
			return;
		}

		res.status(200).json({ message: "Trainer deleted" });
	} catch (error) {
		next(error);
	}
};
