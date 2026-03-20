import type { RequestHandler } from "express";
import mongoose from "mongoose";
import User from "../models/User";
import {
	createUserBodySchema,
	updateUserBodySchema,
} from "../validators/user.validator";

const getIdParam = (idParam: string | string[] | undefined): string | null => {
	if (
		typeof idParam !== "string" ||
		!mongoose.Types.ObjectId.isValid(idParam)
	) {
		return null;
	}

	return idParam;
};

export const createUser: RequestHandler = async (req, res, next) => {
	const parsedBody = createUserBodySchema.safeParse(req.body);

	if (!parsedBody.success) {
		res.status(400).json({
			message: "Invalid user payload",
			errors: parsedBody.error.issues,
		});
		return;
	}

	const { password, ...rest } = parsedBody.data;

	try {
		const existingUser = await User.findOne({
			email: parsedBody.data.email,
		}).select("_id");

		if (existingUser) {
			res.status(409).json({ message: "User with this email already exists" });
			return;
		}

		const user = await User.create({
			...rest,
			passwordHash: password,
		});

		res.status(201).json({ message: "User created", user });
	} catch (error) {
		next(error);
	}
};

export const getAllUsers: RequestHandler = async (_req, res, next) => {
	try {
		const users = await User.find();
		res.status(200).json({ users });
	} catch (error) {
		next(error);
	}
};

export const getMyUser: RequestHandler = async (req, res, next) => {
	if (!req.user || req.user.role !== "user") {
		res.status(403).json({ message: "Only users can access this endpoint" });
		return;
	}

	try {
		const user = await User.findById(req.user.id);

		if (!user) {
			res.status(404).json({ message: "User not found" });
			return;
		}

		res.status(200).json({ user });
	} catch (error) {
		next(error);
	}
};

export const getUserById: RequestHandler = async (req, res, next) => {
	const id = getIdParam(req.params.id);

	if (!id) {
		res.status(400).json({ message: "Invalid user id" });
		return;
	}

	try {
		const user = await User.findById(id);

		if (!user) {
			res.status(404).json({ message: "User not found" });
			return;
		}

		res.status(200).json({ user });
	} catch (error) {
		next(error);
	}
};

export const updateUserById: RequestHandler = async (req, res, next) => {
	const id = getIdParam(req.params.id);

	if (!id) {
		res.status(400).json({ message: "Invalid user id" });
		return;
	}

	const parsedBody = updateUserBodySchema.safeParse(req.body);

	if (!parsedBody.success) {
		res.status(400).json({
			message: "Invalid user update payload",
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
		const updatedUser = await User.findByIdAndUpdate(id, updatePayload, {
			new: true,
			runValidators: true,
		});

		if (!updatedUser) {
			res.status(404).json({ message: "User not found" });
			return;
		}

		res.status(200).json({ message: "User updated", user: updatedUser });
	} catch (error) {
		next(error);
	}
};

export const deleteUserById: RequestHandler = async (req, res, next) => {
	const id = getIdParam(req.params.id);

	if (!id) {
		res.status(400).json({ message: "Invalid user id" });
		return;
	}

	try {
		const deletedUser = await User.findByIdAndDelete(id);

		if (!deletedUser) {
			res.status(404).json({ message: "User not found" });
			return;
		}

		res.status(200).json({ message: "User deleted" });
	} catch (error) {
		next(error);
	}
};
