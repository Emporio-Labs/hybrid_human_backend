import type { RequestHandler } from "express";
import mongoose from "mongoose";
import Plan from "../models/Plan";
import {
	createPlanBodySchema,
	updatePlanBodySchema,
} from "../validators/plan.validator";

const getIdParam = (idParam: string | string[] | undefined): string | null => {
	if (
		typeof idParam !== "string" ||
		!mongoose.Types.ObjectId.isValid(idParam)
	) {
		return null;
	}

	return idParam;
};

export const createPlan: RequestHandler = async (req, res, next) => {
	const parsedBody = createPlanBodySchema.safeParse(req.body);

	if (!parsedBody.success) {
		res.status(400).json({
			message: "Invalid plan payload",
			errors: parsedBody.error.issues,
		});
		return;
	}

	try {
		const plan = await Plan.create(parsedBody.data);
		res.status(201).json({ message: "Plan created", plan });
	} catch (error) {
		next(error);
	}
};

export const getAllPlans: RequestHandler = async (_req, res, next) => {
	try {
		const plans = await Plan.find();
		res.status(200).json({ plans });
	} catch (error) {
		next(error);
	}
};

export const getPlanById: RequestHandler = async (req, res, next) => {
	const id = getIdParam(req.params.id);

	if (!id) {
		res.status(400).json({ message: "Invalid plan id" });
		return;
	}

	try {
		const plan = await Plan.findById(id);

		if (!plan) {
			res.status(404).json({ message: "Plan not found" });
			return;
		}

		res.status(200).json({ plan });
	} catch (error) {
		next(error);
	}
};

export const updatePlanById: RequestHandler = async (req, res, next) => {
	const id = getIdParam(req.params.id);

	if (!id) {
		res.status(400).json({ message: "Invalid plan id" });
		return;
	}

	const parsedBody = updatePlanBodySchema.safeParse(req.body);

	if (!parsedBody.success) {
		res.status(400).json({
			message: "Invalid plan update payload",
			errors: parsedBody.error.issues,
		});
		return;
	}

	try {
		const updatedPlan = await Plan.findByIdAndUpdate(id, parsedBody.data, {
			new: true,
			runValidators: true,
		});

		if (!updatedPlan) {
			res.status(404).json({ message: "Plan not found" });
			return;
		}

		res.status(200).json({ message: "Plan updated", plan: updatedPlan });
	} catch (error) {
		next(error);
	}
};

export const deletePlanById: RequestHandler = async (req, res, next) => {
	const id = getIdParam(req.params.id);

	if (!id) {
		res.status(400).json({ message: "Invalid plan id" });
		return;
	}

	try {
		const deletedPlan = await Plan.findByIdAndDelete(id);

		if (!deletedPlan) {
			res.status(404).json({ message: "Plan not found" });
			return;
		}

		res.status(200).json({ message: "Plan deleted" });
	} catch (error) {
		next(error);
	}
};
