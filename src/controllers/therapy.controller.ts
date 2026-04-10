import type { RequestHandler } from "express";
import mongoose from "mongoose";
import Therapy from "../models/Therapy";
import {
	createTherapyBodySchema,
	updateTherapyBodySchema,
} from "../validators/therapy.validator";

const getIdParam = (idParam: string | string[] | undefined): string | null => {
	if (
		typeof idParam !== "string" ||
		!mongoose.Types.ObjectId.isValid(idParam)
	) {
		return null;
	}

	return idParam;
};

const areValidObjectIds = (ids: string[]): boolean =>
	ids.every((id) => mongoose.Types.ObjectId.isValid(id));

export const createTherapy: RequestHandler = async (req, res, next) => {
	const parsedBody = createTherapyBodySchema.safeParse(req.body);

	if (!parsedBody.success) {
		res.status(400).json({
			message: "Invalid therapy payload",
			errors: parsedBody.error.issues,
		});
		return;
	}

	if (!areValidObjectIds(parsedBody.data.slots)) {
		res.status(400).json({ message: "Invalid slot references" });
		return;
	}

	try {
		const therapy = await Therapy.create(parsedBody.data);
		res.status(201).json({ message: "Therapy created", therapy });
	} catch (error) {
		next(error);
	}
};

export const getAllTherapies: RequestHandler = async (_req, res, next) => {
	try {
		const therapies = await Therapy.find();
		res.status(200).json({ therapies });
	} catch (error) {
		next(error);
	}
};

export const getTherapyById: RequestHandler = async (req, res, next) => {
	const id = getIdParam(req.params.id);

	if (!id) {
		res.status(400).json({ message: "Invalid therapy id" });
		return;
	}

	try {
		const therapy = await Therapy.findById(id);

		if (!therapy) {
			res.status(404).json({ message: "Therapy not found" });
			return;
		}

		res.status(200).json({ therapy });
	} catch (error) {
		next(error);
	}
};

export const updateTherapyById: RequestHandler = async (req, res, next) => {
	const id = getIdParam(req.params.id);

	if (!id) {
		res.status(400).json({ message: "Invalid therapy id" });
		return;
	}

	const parsedBody = updateTherapyBodySchema.safeParse(req.body);

	if (!parsedBody.success) {
		res.status(400).json({
			message: "Invalid therapy update payload",
			errors: parsedBody.error.issues,
		});
		return;
	}

	if (parsedBody.data.slots && !areValidObjectIds(parsedBody.data.slots)) {
		res.status(400).json({ message: "Invalid slot references" });
		return;
	}

	try {
		const updatedTherapy = await Therapy.findByIdAndUpdate(
			id,
			parsedBody.data,
			{
				returnDocument: "after",
				runValidators: true,
			},
		);

		if (!updatedTherapy) {
			res.status(404).json({ message: "Therapy not found" });
			return;
		}

		res.status(200).json({ message: "Therapy updated", therapy: updatedTherapy });
	} catch (error) {
		next(error);
	}
};

export const deleteTherapyById: RequestHandler = async (req, res, next) => {
	const id = getIdParam(req.params.id);

	if (!id) {
		res.status(400).json({ message: "Invalid therapy id" });
		return;
	}

	try {
		const deletedTherapy = await Therapy.findByIdAndDelete(id);

		if (!deletedTherapy) {
			res.status(404).json({ message: "Therapy not found" });
			return;
		}

		res.status(200).json({ message: "Therapy deleted" });
	} catch (error) {
		next(error);
	}
};
